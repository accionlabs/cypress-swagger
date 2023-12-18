import { join } from 'path';
import { constants } from '../constants.js';
import {
	createExampleUsingSchema,
	getAllCombinationsForRequestbodyAndResponse,
	getOnlyResponseCombinations,
	getParamTypeFromPathObject,
	getSecurityAtPathLevelOrGlobalLevel,
	getSecurityHeaderWithSchma,
	mergeArrayOfObjects,
	mergeParamAndResponseCombinations,
	setPathParamAndRequestAndResponseMergedObjects,
} from '../openAPIhelperMethods.js';
import { openAPISpec } from '../openAPISpec.js';
import {
	changeDirectory,
	concatFileName,
	writeFile,
	readFileAsync,
	writeFileAsync,
	deleteFile,
	checkIfFolderExists
} from '../util.js';


export async function createDataToSetInFixtureFile() {
	let pathObject = openAPISpec.SwaggerPathArrObject;
	let paramTypesArrObjects = [];
	let allRequestAndResponseCombinationsArrObjects = [];
	pathObject.forEach(async (path) => {
		let paramTypeObject = await getParamTypeFromPathObject(path.parameters);
		let combinations = [];
		if (Object.keys(paramTypeObject).length !== 0) {
			paramTypeObject.operationId = path.operationId;
			paramTypeObject.apiEndpoint = path.apiEndpoint;
			paramTypeObject.operation = path.operation ? path.operation : "CREATE";
			paramTypesArrObjects.push(paramTypeObject);

		}
		combinations = await getAllCombinationsForRequestbodyAndResponse(path);
		allRequestAndResponseCombinationsArrObjects = await mergeArrayOfObjects(
			allRequestAndResponseCombinationsArrObjects,
			combinations
		);

		allRequestAndResponseCombinationsArrObjects = allRequestAndResponseCombinationsArrObjects.map(obj => ({ ...obj, ["operation"]: path.operation ? path.operation : "CREATE" }));


	});
	openAPISpec.paramTypesArrObjects = paramTypesArrObjects;
	openAPISpec.allRequestAndResponseCombinationsArrObjects = await
		allRequestAndResponseCombinationsArrObjects;
	await setPathParamAndRequestAndResponseMergedObjects();
	openAPISpec.paramAndResponseTypedArray = await mergeParamAndResponseCombinations();
	await getOnlyResponseCombinations();
	if (constants.operation == "CREATE") {
		await changeDirectory(constants.fixtureDirPath);
	}
	await createFixtureFiles();
}

export async function createFixtureFiles() {
	let fileName;
	let requestBodyFileNames = [],
		paramRequestAndResponseFileNames = [],
		onlyResponseCombinationsFileNames = [],
		paramAndResponseFileNames = [];


	openAPISpec.paramTypesArrObjects.forEach(async (param, index) => {
		fileName =
			param.operationId != undefined
				? param.operationId
				: concatFileName(param.apiEndpoint);
		let paramKeys = param ? Object.keys(param) : "";
		let paramTypes = [];
		paramKeys.forEach((keys) => {
			if (
				keys == "pathParam" ||
				keys == "queryParam" ||
				keys == "cookie" ||
				keys == "header"
			) {
				paramTypes.push(keys);
			}
		});

		await writeFixtureParam(param, fileName, index, paramTypes);

	});

	openAPISpec.allRequestAndResponseCombinationsArrObjects.forEach(
		async (requestAndResponse, index) => {
			let requestContentType = requestAndResponse.contentType
				? requestAndResponse.contentType.replace("/", "_").replaceAll("*", "")
				: "";
			let responseContentType = requestAndResponse.responseContentType
				? requestAndResponse.responseContentType
					.replace("/", "_")
					.replaceAll("*", "")
				: "";
			let fileName = `${requestAndResponse.responseStatusCode
				? requestAndResponse.responseStatusCode
				: "default"
				}_${responseContentType}_${requestContentType}_${requestAndResponse.operationId
					? requestAndResponse.operationId
					: concatFileName(requestAndResponse.apiEndpoint)
				}`;

			let statusCodeWiseValue =
				requestAndResponse.statusCodes.indexOf(
					requestAndResponse.responseStatusCode
				) > -1
					? requestAndResponse[requestAndResponse.responseStatusCode]
					: requestAndResponse.customCreatedExample
						? requestAndResponse.customCreatedExample
						: "";

			let data = {
				headers: {
					"Content-Type": requestAndResponse.contentType,
					accept: requestAndResponse.responseContentType,
				},
				payload: statusCodeWiseValue,
				responseStatusCode: requestAndResponse.responseStatusCode,
				responseValue: requestAndResponse.responseValue,
				responseSchema: requestAndResponse.responseSchema ? requestAndResponse.responseSchema : ""
			};

			openAPISpec.allRequestAndResponseCombinationsArrObjects[
				index
			].fixtureFileName = fileName;
			requestBodyFileNames.push(fileName);

			if (constants.operation == "UPDATE") {
				await doUpdateAsPerOperation(requestAndResponse.operation, fileName, customStringify(data));
			}
			else {

				await writeFile(`${fileName}.json`, customStringify(data));
			}
		}
	);
	openAPISpec.requestFixtureBodyFileNames = requestBodyFileNames;

	openAPISpec.paramAndRequestAndResponse.forEach(
		async (paramRequestAndResponse, index) => {
			let paramKeys = paramRequestAndResponse
				? Object.keys(paramRequestAndResponse)
				: "";
			let paramTypes = [];
			let data = {};
			let securitySchema = getSecurityAtPathLevelOrGlobalLevel(paramRequestAndResponse);
			let securityHeaders =
				securitySchema != "" && Object.keys(securitySchema).length > 0
					? getSecurityHeaderWithSchma(securitySchema)
					: "";

			paramKeys.forEach((keys) => {
				if (
					keys == "pathParam" ||
					keys == "queryParam" ||
					keys == "cookie" ||
					keys == "header"
				) {
					paramTypes.push(keys);
				}
			});

			let requestContentType = paramRequestAndResponse.contentType
				? paramRequestAndResponse.contentType
					.replace("/", "_")
					.replaceAll("*", "")
				: "";
			let responseContentType = paramRequestAndResponse.responseContentType
				? paramRequestAndResponse.responseContentType
					.replace("/", "_")
					.replaceAll("*", "")
				: "";
			let fileName = `${paramRequestAndResponse.responseStatusCode
				? paramRequestAndResponse.responseStatusCode
				: "default"
				}_${responseContentType}_${requestContentType}_${paramRequestAndResponse.operationId
					? paramRequestAndResponse.operationId
					: concatFileName(paramRequestAndResponse.apiEndpoint)
				}`;

			openAPISpec.paramAndRequestAndResponse[index].fixtureFileName = fileName;
			let fixtureObject = {
				headers: {
					"Content-Type": paramRequestAndResponse.contentType,
					accept: paramRequestAndResponse.responseContentType,
					header: "",
				},
				payload: paramRequestAndResponse.responseStatusCode
					? paramRequestAndResponse[paramRequestAndResponse.responseStatusCode]
					: "",
				responseStatusCode: paramRequestAndResponse.responseStatusCode,
				responseValue: paramRequestAndResponse.responseValue,
				responseSchema: paramRequestAndResponse.responseSchema ? paramRequestAndResponse.responseSchema : ""
			};
			paramTypes.forEach((type) => {
				fixtureObject[type] = {};
				paramRequestAndResponse[type].forEach(async (param) => {
					if (param.type == "header") {
						fixtureObject.headers.header = param.example
							? param.example
							: createExampleUsingSchema(param.schema);
					} else {
						fixtureObject[type][param.name] = param.example
							? param.example
							: createExampleUsingSchema(param.schema);
					}
					paramRequestAndResponseFileNames.push(fileName);
				});
			});
			fixtureObject = addSecurityHeaders(securityHeaders, fixtureObject);
			data = customStringify(fixtureObject);


			if (constants.operation == "UPDATE") {
				await doUpdateAsPerOperation(paramRequestAndResponse.operation, fileName, data);
			}
			else {
				await writeFile(`${fileName}.json`, data);
			}
		}
	);
	openAPISpec.paramRequestAndResponseFileNames =
		paramRequestAndResponseFileNames;

	openAPISpec.onlyResponseCombinations.forEach(
		async (responseCombinationOnly, index) => {
			let responseContentType = responseCombinationOnly.contentType
				? responseCombinationOnly.contentType.replace("/", "_")
				: "";
			let fileName = `${responseCombinationOnly.responseStatusCode
				? responseCombinationOnly.responseStatusCode
				: "default"
				}_${responseContentType}_${responseCombinationOnly.operationId
					? responseCombinationOnly.operationId
					: concatFileName(responseCombinationOnly.apiEndpoint)
				}`;

			let securitySchema = getSecurityAtPathLevelOrGlobalLevel(responseCombinationOnly);
			let securityHeaders =
				securitySchema != "" && Object.keys(securitySchema).length > 0
					? getSecurityHeaderWithSchma(securitySchema)
					: "";

			let data = {
				headers: {
					"Content-Type": responseCombinationOnly.contentType,
					accept: responseCombinationOnly.responseContentType,
				},
				responseStatusCode: responseCombinationOnly.responseStatusCode,
				responseValue: responseCombinationOnly.responseValue,
				responseSchema: responseCombinationOnly.responseSchema ? responseCombinationOnly.responseSchema : ""
			};

			data = addSecurityHeaders(securityHeaders, data);

			openAPISpec.onlyResponseCombinations[index].fixtureFileName = fileName;
			onlyResponseCombinationsFileNames.push(fileName);
			if (constants.operation == "UPDATE") {
				await doUpdateAsPerOperation(responseCombinationOnly.operation, fileName, customStringify(data));
			}
			else {
				await writeFile(`${fileName}.json`, customStringify(data));
			}
		}
	);

	openAPISpec.onlyResponseCombinationsFileNames =
		onlyResponseCombinationsFileNames;

	openAPISpec.paramAndResponseTypedArray.forEach(
		async (paramAndResponse, index) => {
			let paramKeys = paramAndResponse
				? Object.keys(paramAndResponse)
				: "";
			let paramTypes = [];
			let data = {};
			let securitySchema = getSecurityAtPathLevelOrGlobalLevel(paramAndResponse);
			let securityHeaders =
				securitySchema != "" && Object.keys(securitySchema).length > 0
					? getSecurityHeaderWithSchma(securitySchema)
					: "";

			paramKeys.forEach((keys) => {
				if (
					keys == "pathParam" ||
					keys == "queryParam" ||
					keys == "cookie" ||
					keys == "header"
				) {
					paramTypes.push(keys);
				}
			});

			let requestContentType = paramAndResponse.contentType
				? paramAndResponse.contentType
					.replace("/", "_")
					.replaceAll("*", "")
				: "";
			let responseContentType = paramAndResponse.responseContentType
				? paramAndResponse.responseContentType
					.replace("/", "_")
					.replaceAll("*", "")
				: "";
			let fileName = `${paramAndResponse.responseStatusCode
				? paramAndResponse.responseStatusCode
				: "default"
				}_${responseContentType}_${requestContentType}_${paramAndResponse.operationId
					? paramAndResponse.operationId
					: concatFileName(paramAndResponse.apiEndpoint)
				}`;

			openAPISpec.paramAndResponseTypedArray[index].fixtureFileName = fileName;
			let fixtureObject = {
				headers: {
					"Content-Type": paramAndResponse.contentType,
					accept: paramAndResponse.responseContentType,
					header: "",
				},
				responseStatusCode: paramAndResponse.responseStatusCode,
				responseValue: paramAndResponse.responseValue,
				responseSchema: paramAndResponse.responseSchema ? paramAndResponse.responseSchema : ""
			};
			paramTypes.forEach((type) => {
				fixtureObject[type] = {};
				paramAndResponse[type].forEach(async (param) => {
					if (param.type == "header") {
						fixtureObject.headers.header = param.example
							? param.example
							: createExampleUsingSchema(param.schema);
					} else {
						fixtureObject[type][param.name] = param.example
							? param.example
							: createExampleUsingSchema(param.schema);
					}
					paramAndResponseFileNames.push(fileName);
				});
			});
			fixtureObject = addSecurityHeaders(securityHeaders, fixtureObject);
			data = customStringify(fixtureObject);
			if (constants.operation == "UPDATE") {
				await doUpdateAsPerOperation(paramAndResponse.operation, fileName, data);
			}
			else {
				await writeFile(`${fileName}.json`, data);
			}
		}
	);
	openAPISpec.paramAndResponseFileNames =
		paramAndResponseFileNames;


}

export async function writeFixtureParam(param, fileName, parentIndex, paramTypes) {
	let paramFileNames = [];
	let securitySchema = getSecurityAtPathLevelOrGlobalLevel(param);
	let securityHeaders =
		securitySchema != "" && Object.keys(securitySchema).length > 0
			? getSecurityHeaderWithSchma(securitySchema)
			: "";



	let fixtureFileData = {
		headers: {},
		responseStatusCode: openAPISpec.paramTypesArrObjects[parentIndex]
			.responseStatusCode
			? openAPISpec.paramTypesArrObjects[parentIndex].responseStatusCode
			: "",
		responseSchema: openAPISpec.paramTypesArrObjects[parentIndex].responseSchema
			? openAPISpec.paramTypesArrObjects[parentIndex].responseSchema
			: "",
		responseValue: openAPISpec.paramTypesArrObjects[parentIndex].responseValue
			? openAPISpec.paramTypesArrObjects[parentIndex].responseValue
			: "",
	};

	paramTypes.forEach(async (type) => {
		fixtureFileData[type] = {};
		param[type].forEach((param) => {
			if (param.type == "header") {
				fixtureFileData.headers.header = param.example
					? param.example
					: createExampleUsingSchema(param.schema);
			} else {
				fixtureFileData[type][param.name] = param.example
					? param.example
					: createExampleUsingSchema(param.schema);
			}
		});
	});


	fixtureFileData = addSecurityHeaders(securityHeaders, fixtureFileData);

	paramFileNames.push(fileName);
	openAPISpec.paramTypesArrObjects[parentIndex].fixtureFileName = fileName;
	if (constants.operation == "UPDATE") {
		await doUpdateAsPerOperation(param.operation, fileName, data);
	}
	else {
		await writeFile(`${fileName}.json`, customStringify(fixtureFileData));
	}

	openAPISpec.paramFixtureFileNames = paramFileNames;
}

function customStringify(obj, replacer = null, space = 2) {
	const seen = new WeakSet();
	return JSON.stringify(
		obj,
		function (key, value) {
			if (typeof value === "object" && value !== null) {
				if (seen.has(value)) {
					// Circular reference found, return a placeholder or skip it
					return "[Circular]";
				}
				seen.add(value);
			}
			return replacer ? replacer(key, value) : value;
		},
		space
	);
}

function addSecurityHeaders(securityHeaders, fixtureFileData) {
	if (securityHeaders != "") {
		switch (securityHeaders.in) {
			case "header":
				fixtureFileData.headers = { ...fixtureFileData.headers, ...securityHeaders.security };
				break;
			case "query":
				fixtureFileData.queryParam = Object.assign(
					fixtureFileData.queryParam,
					securityHeaders.security
				);
				// Your code for handling query parameters here
				break;
			case "cookie":
				fixtureFileData.cookie = Object.assign(
					fixtureFileData.cookie,
					securityHeaders.security
				);
				// Your code for handling cookies here
				break;
			default:
			// console.log("Unknown request type:", requestType);
			// Handle unknown request types here
		}
	}
	return fixtureFileData;
}

export async function createBackupForFixtures(filePath) {
	await changeDirectory(join(`${constants.fullPathOfSwaggerGitProject}`, `cypress`, `fixtures`));
	try {
		const fixtureFilePath = join(`${constants.fullPathOfSwaggerGitProject}`, `cypress`, `fixtures`, `${filePath}.json`);
		if (checkIfFolderExists(fixtureFilePath)) {
			const fileData = await readFileAsync(fixtureFilePath);
			const backupFilePath = join(`${constants.fullPathOfSwaggerGitProject}`, `cypress`, `fixtures`, `${filePath}_backup.json`);
			await writeFileAsync(backupFilePath, fileData);
		}

	}
	catch (err) {
		console.log("inside fixture " + err);
		throw err;
	}
}


async function doUpdateAsPerOperation(type, fileName, data) {
	const fixtureDir = join(`${constants.fullPathOfSwaggerGitProject}`, `cypress`, `fixtures`)
	switch (type) {
		case "UPDATE":
			await createBackupForFixtures(fileName);
			changeDirectory(fixtureDir);
			await writeFile(`${fileName}.json`, data);
			break;
		case "DEPRECATED":
			// code to be executed if expression matches DEPRECATED
			changeDirectory(fixtureDir);
			await writeFile(`${fileName}.json`, data);
			break;
		case "DELETE":
			// code to be executed if expression matches DELETE
			await createBackupForFixtures(fileName);
			changeDirectory(fixtureDir);
			await deleteFile(`${fileName}.json`);
			break;
		case "CREATE":
			// code to be executed if expression matches CREATE
			changeDirectory(fixtureDir);
			await writeFile(`${fileName}.json`, data);
			break;
		// more cases as needed
		default:
		// code to be executed if expression doesn't match any case
	}

}
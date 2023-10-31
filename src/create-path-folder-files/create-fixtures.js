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
} from '../util.js';

export function createDataToSetInFixtureFile() {
	let pathObject = openAPISpec.SwaggerPathArrObject;
	let paramTypesArrObjects = [];
	let allRequestAndResponseCombinationsArrObjects = [];
	pathObject.forEach((path) => {
		let paramTypeObject = getParamTypeFromPathObject(path.parameters);
		let combinations = [];
		if (Object.keys(paramTypeObject).length !== 0) {
			paramTypeObject.operationId = path.operationId;
			paramTypeObject.apiEndpoint = path.apiEndpoint;
			paramTypesArrObjects.push(paramTypeObject);
		}
		combinations = getAllCombinationsForRequestbodyAndResponse(path);
		allRequestAndResponseCombinationsArrObjects = mergeArrayOfObjects(
			allRequestAndResponseCombinationsArrObjects,
			combinations
		);
	});
	openAPISpec.paramTypesArrObjects = paramTypesArrObjects;
	openAPISpec.allRequestAndResponseCombinationsArrObjects =
		allRequestAndResponseCombinationsArrObjects;
	setPathParamAndRequestAndResponseMergedObjects();
	openAPISpec.paramTypesArrObjects = mergeParamAndResponseCombinations();
	getOnlyResponseCombinations();
	changeDirectory(constants.fixtureDirPath);
	createFixtureFiles();
}

export function createFixtureFiles() {
	let fileName;
	let requestBodyFileNames = [],
		paramRequestAndResponseFileNames = [],
		onlyResponseCombinationsFileNames = [];
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
			let fileName = `${
				requestAndResponse.responseStatusCode
					? requestAndResponse.responseStatusCode
					: "default"
			}_${responseContentType}_${requestContentType}_${
				requestAndResponse.operationId
					? requestAndResponse.operationId
					: concatFileName(requestAndResponse.apiEndpoint)
			}.json`;

			let statusCodeWiseValue =
				requestAndResponse.statusCodes.indexOf(
					requestAndResponse.responseStatusCode
				) > -1
					? requestAndResponse[requestAndResponse.responseStatusCode]
					: requestAndResponse.customCreatedExample
					? requestAndResponse.customCreatedExample
					: "";

			let data = JSON.stringify({
				headers: {
					"Content-Type": requestAndResponse.contentType,
					accept: requestAndResponse.responseContentType,
				},
				payload: statusCodeWiseValue,
				responseStatusCode: requestAndResponse.responseStatusCode,
				responseValue: requestAndResponse.responseValue,
			});

			openAPISpec.allRequestAndResponseCombinationsArrObjects[
				index
			].fixtureFileName = fileName;
			requestBodyFileNames.push(fileName);
			await writeFile(fileName, data);
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
			let securitySchema = getSecurityAtPathLevelOrGlobalLevel(
				paramRequestAndResponse
			);

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
			let fileName = `${
				paramRequestAndResponse.responseStatusCode
					? paramRequestAndResponse.responseStatusCode
					: "default"
			}_${responseContentType}_${requestContentType}_${
				paramRequestAndResponse.operationId
					? paramRequestAndResponse.operationId
					: concatFileName(paramRequestAndResponse.apiEndpoint)
			}.json`;

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
			await writeFile(fileName, data);
		}
	);
	openAPISpec.paramRequestAndResponseFileNames =
		paramRequestAndResponseFileNames;

	openAPISpec.onlyResponseCombinations.forEach(
		async (responseCombinationOnly, index) => {
			let responseContentType = responseCombinationOnly.contentType
				? responseCombinationOnly.contentType.replace("/", "_")
				: "";
			let fileName = `${
				responseCombinationOnly.responseStatusCode
					? responseCombinationOnly.responseStatusCode
					: "default"
			}_${responseContentType}_${
				responseCombinationOnly.operationId
					? responseCombinationOnly.operationId
					: concatFileName(responseCombinationOnly.apiEndpoint)
			}.json`;

			let data = JSON.stringify({
				headers: {
					"Content-Type": responseCombinationOnly.contentType,
					accept: responseCombinationOnly.responseContentType,
				},
				responseStatusCode: responseCombinationOnly.responseStatusCode,
				responseValue: responseCombinationOnly.responseValue,
			});

			openAPISpec.onlyResponseCombinations[index].fixtureFileName = fileName;
			onlyResponseCombinationsFileNames.push(fileName);
			await writeFile(fileName, data);
		}
	);

	openAPISpec.onlyResponseCombinationsFileNames =
		onlyResponseCombinationsFileNames;
}

export function writeFixtureParam(param, fileName, parentIndex, paramTypes) {
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

	writeFile(`${fileName}.json`, customStringify(fixtureFileData));
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
				fixtureFileData.headers = securityHeaders.security;
				fixtureFileData.headers["header"] = "";
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

import jsf from "json-schema-faker";
import pkg from "lodash";
import xml2js from "xml2js";

import { openAPISpec } from "./openAPISpec.js";

// import { openAPISpec } from "./openAPISpec";
const {
	values,
	mapValues,
	uniq,
	filter,
	compact,
	merge,
	omit,
	concat,
	reject,
	uniqWith,
	isEqual,
} = pkg;
export function getPathsFromSwaggerObject() {
	const arrObj = convertPathIntoArrayOfObjects(
		openAPISpec.swaggerParsedObject.paths,
		"apiEndpoint"
	);
	return arrObj;
}

export function convertPathIntoArrayOfObjects(obj, keyAs) {
	return values(
		mapValues(obj, (value, key) => {
			value[keyAs] = key;
			return value;
		})
	);
}

export async function flattenPathObject(arrObj) {
	let flattenObj = [];
	arrObj.forEach((path) => {
		let methodNames = Object.keys(path);
		var methodObj;
		methodNames = methodNames.filter((e) => e !== "apiEndpoint");
		methodNames.forEach((method) => {
			methodObj = path[method];
			methodObj.methodName = method;
			methodObj["apiEndpoint"] = path["apiEndpoint"];
			flattenObj.push(methodObj);
		});
	});
	return flattenObj;
}

export async function getTagsFolders(paths) {
	let tags = [];
	if (paths != undefined)
		paths.forEach((path) => {
			if (tags.indexOf(path.tags) === -1) {
				tags.push(
					path.tags != undefined
						? path.tags.join("")
						: (path.tags = ["default"])
				);
			}
		});
	openAPISpec.SwaggerPathArrObject = paths;
	return uniq(tags);
}

export async function getOperationsForTag(tag) {
	let operations = filter(openAPISpec.SwaggerPathArrObject, {
		tags: [`${tag}`],
	});
	return operations.length > 0 ? operations : [];
}

export async function getParamTypeFromPathObject(parameters) {
	let pathParamArrObj = [],
		queryParamArrObj = [],
		cookieArrObj = [],
		headerArrObj = [],
		payloadObj = {};

	if (parameters != undefined) {
		parameters.forEach(async (param) => {
			let obj = {};
			switch (param.in) {
				case "path":
					pathParamArrObj.push(setValuesInPayloadObject(obj, param));
					payloadObj.pathParam = pathParamArrObj;
					payloadObj.type = "pathParam";
					break;
				case "query":
					queryParamArrObj.push(setValuesInPayloadObject(obj, param));
					payloadObj.queryParam = queryParamArrObj;
					payloadObj.type = "queryParam";
					break;
				case "cookie":
					cookieArrObj.push(setValuesInPayloadObject(obj, param));
					payloadObj.cookie = cookieArrObj;
					payloadObj.type = "cookie";
					break;
				case "header":
					headerArrObj.push(setValuesInPayloadObject(obj, param));
					payloadObj.header = headerArrObj;
					payloadObj.type = "header";
					break;
			}
		});
	}
	return payloadObj;
}

export function compactObject(obj) {
	return compact(obj);
}

export async function setValuesInPayloadObject(obj, param) {
	obj.type = param.in;
	obj.name = param.name ? param.name : undefined;
	obj.schema = param.schema ? param.schema : undefined;
	obj.example = param.example
		? param.example
		: createExampleUsingSchema(param.schema);

	return omit(obj, undefined);
}

export function flattenRequestBodyObject(requestBody) {
	let contentArray = [];
	let exampleArray = [];
	const content = requestBody ? requestBody.content : {};
	for (const contentType in content) {
		if (content.hasOwnProperty(contentType)) {
			const contentItem = content[contentType];
			const requestBodyDescription = requestBody
				? requestBody.description
				: null;
			contentArray.push({
				contentType: contentType,
				schema: contentItem.schema,
				description: requestBodyDescription,
			});
			const examples = contentItem.examples;
			if (examples) {
				for (const statusCode in examples) {
					if (examples.hasOwnProperty(statusCode)) {
						exampleArray.push({
							statusCode: statusCode,
							example: examples[statusCode],
						});
					}
				}
			}
		}
	}
	return merge(contentArray, exampleArray);
}

export function getMergedObjects(requestBodyObj, responseObj) {
	return merge(requestBodyObj, responseObj);
}

export async function mergeArrayOfObjects(originalArray, newArray) {
	return concat(originalArray, newArray);
}

export async function getAllCombinationsForRequestbodyAndResponse(path) {
	let requestBody = path.requestBody ? path.requestBody : undefined;
	let response = path.responses ? path.responses : undefined;
	let multipleCombinationsArrObj = [],
		responseCombinations = [],
		allCombinations = [];

	if (requestBody && requestBody.content) {
		const requestContentTypes = Object.keys(requestBody.content);
		requestContentTypes.forEach(async (contentType) => {
			let currentCombination = {};
			currentCombination.operationId = path.operationId;
			currentCombination.description = path.description ? path.description : "";
			currentCombination.contentType = contentType;
			currentCombination.schema = requestBody.content[contentType].schema;
			currentCombination.singleExample =
				requestBody.content.example != undefined
					? requestBody.content.example
					: undefined;
			let requestBodyExamplesKeys =
				requestBody.content[contentType].examples != undefined
					? Object.keys(requestBody.content[contentType].examples)
					: undefined;
			currentCombination.statusCodes =
				requestBodyExamplesKeys != undefined &&
					requestBodyExamplesKeys.length != 0
					? requestBodyExamplesKeys
					: [];
			if (
				requestBodyExamplesKeys != undefined &&
				requestBodyExamplesKeys.length != 0
			) {
				requestBodyExamplesKeys.forEach((key) => {
					currentCombination = JSON.parse(JSON.stringify(currentCombination));
					currentCombination[key] =
						requestBody.content[contentType].examples &&
							requestBody.content[contentType].examples[key] &&
							requestBody.content[contentType].examples[key].value
							? requestBody.content[contentType].examples[key].value
							: contentType == "application/xml"
								? createXmlExampleUsingSchema(
									requestBody.content[contentType].schema
								)
								: contentType != "multipart/form-data"
									? createExampleUsingSchema(
										requestBody.content[contentType].schema
									)
									: "";
				});
			}

			if (requestBody.content[contentType].examples == undefined) {
				currentCombination.customCreatedExample =
					contentType == "application/xml"
						? createXmlExampleUsingSchema(
							requestBody.content[contentType].schema
						)
						: createExampleUsingSchema(requestBody.content[contentType].schema);
			}
			multipleCombinationsArrObj.push(currentCombination);
		});
	}

	if (response) {
		let responseStatusCodes = Object.keys(response);
		let responseContentTypes;

		if (responseStatusCodes) {
			responseStatusCodes.forEach((statusCode) => {
				let responseCombinationObject = {};
				responseCombinationObject = JSON.parse(
					JSON.stringify(responseCombinationObject)
				);
				responseContentTypes = response[statusCode].content
					? Object.keys(response[statusCode].content)
					: undefined;
				responseCombinationObject.responseStatusCode = statusCode;
				responseCombinationObject.responseDescription =
					response[statusCode].description;
				responseCombinationObject.operationId = path.operationId;
				if (responseContentTypes && responseContentTypes.length != 0) {
					responseContentTypes.forEach((contentType) => {
						responseCombinationObject = JSON.parse(
							JSON.stringify(responseCombinationObject)
						);
						responseCombinationObject.responseContentType = contentType;
						responseCombinationObject.responseSchema = response[statusCode]
							.content[contentType].schema
							? response[statusCode].content[contentType].schema
							: undefined;
						responseCombinationObject.responseValue = response[statusCode]
							.content[contentType].example
							? response[statusCode].content[contentType].example
							: undefined;
						responseCombinations.push(responseCombinationObject);
					});
				} else {
					responseCombinations.push(
						JSON.parse(JSON.stringify(responseCombinationObject))
					);
				}
			});
		}
	}

	responseCombinations.forEach(async (responseCombination) => {
		openAPISpec.responseCombinations.push(responseCombination);
	});

	responseCombinations.forEach(async (responseCombination) => {
		multipleCombinationsArrObj.forEach((requestBodyObj) => {
			if (responseCombination.operationId == requestBodyObj.operationId) {
				allCombinations.push(
					getMergedObjects(
						JSON.parse(JSON.stringify(requestBodyObj)),
						JSON.parse(JSON.stringify(responseCombination))
					)
				);
			}
		});
	});

	return allCombinations;
}

export function createExampleUsingSchema(schema) {
	const schemaAsArray = schema ? schema : [];
	let obj = "";
	jsf.option({ useExamplesValue: true });
	try {
		obj =
			schema.format != "binary" && schema.type != "header"
				? jsf.generate(schemaAsArray)
				: "";
	} catch {
		obj = "";
	}
	return obj;
}

export function createXmlExampleUsingSchema(jsonSchema) {
	// Create an XML builder object
	const jsonObject = createExampleUsingSchema(jsonSchema);

	const builder = new xml2js.Builder({ renderOpts: { pretty: false } });
	let xmlString = "";
	try {
		xmlString = builder.buildObject(jsonObject);
	} catch {
		xmlString = "";
	}
	return xmlString;
}

export async function getFixtureObjectForPath(operationId) {
	let paramList = filter(openAPISpec.paramTypesArrObjects, {
		operationId: operationId,
	});

	let requestBodyList = filter(
		openAPISpec.allRequestAndResponseCombinationsArrObjects,
		{
			operationId: operationId,
		}
	);

	let paramRequestAndResponseList = filter(
		openAPISpec.paramAndRequestAndResponse,
		{
			operationId: operationId,
		}
	);

	let onlyResponseCombinationsList = filter(
		openAPISpec.onlyResponseCombinations,
		{
			operationId: operationId,
		}
	);

	let paramAndResponseCombinationsList = filter(
		openAPISpec.paramAndResponseTypedArray,
		{
			operationId: operationId,
		}
	);

	return paramList.length > 0
		? { data: paramList, type: "param" }
		: requestBodyList.length > 0
			? { data: requestBodyList, type: "requestBody" }
			: paramRequestAndResponseList.length > 0
				? { data: paramRequestAndResponseList, type: "paramRequestAndResponse" }
				: onlyResponseCombinationsList.length > 0
					? { data: onlyResponseCombinationsList, type: "onlyResponseCombinations" }
					: paramAndResponseCombinationsList.length > 0 ? { data: paramAndResponseCombinationsList, type: "paramAndResponse" } : { data: undefined, type: undefined };
}

export async function setPathParamAndRequestAndResponseMergedObjects() {
	let operationIds = [];

	openAPISpec.paramTypesArrObjects.forEach((param) => {
		openAPISpec.allRequestAndResponseCombinationsArrObjects.forEach(
			(requestAndResponse) => {
				if (param.operationId === requestAndResponse.operationId) {
					openAPISpec.paramAndRequestAndResponse.push(
						getMergedObjects(
							JSON.parse(JSON.stringify(param)),
							JSON.parse(JSON.stringify(requestAndResponse))
						)
					);
					operationIds.push(param.operationId);
				}
			}
		);
	});

	openAPISpec.paramAndRequestAndResponse = uniqWith(
		openAPISpec.paramAndRequestAndResponse,
		isEqual()
	);
	openAPISpec.allRequestAndResponseCombinationsArrObjects = reject(
		openAPISpec.allRequestAndResponseCombinationsArrObjects,
		(item) => {
			return operationIds.indexOf(item.operationId) > -1;
		}
	);

	openAPISpec.paramTypesArrObjects = reject(
		openAPISpec.paramTypesArrObjects,
		(item) => {
			return operationIds.indexOf(item.operationId) > -1;
		}
	);
}

export async function mergeParamAndResponseCombinations() {
	let paramAndResponseCombinations = [];
	let operationIds = [];
	openAPISpec.responseCombinations.forEach((param) => {
		openAPISpec.paramTypesArrObjects.forEach((responseCombination) => {
			if (param.operationId === responseCombination.operationId) {
				paramAndResponseCombinations.push(
					getMergedObjects(param, responseCombination)
				);
				operationIds.push(param.operationId);
			}
		});
	});

	paramAndResponseCombinations = uniqWith(
		paramAndResponseCombinations,
		isEqual()
	);

	openAPISpec.paramTypesArrObjects = reject(
		openAPISpec.paramTypesArrObjects,
		(item) => {
			return operationIds.indexOf(item.operationId) > -1;
		}
	);

	return paramAndResponseCombinations;
}

export async function getOnlyResponseCombinations() {
	let allOperationsId;
	let requestAndResponseoperationId =
		openAPISpec.allRequestAndResponseCombinationsArrObjects.map(
			(combination) => {
				return combination.operationId;
			}
		);

	let paramTypesoperationId = openAPISpec.paramTypesArrObjects.map(
		(combination) => {
			return combination.operationId;
		}
	);

	let paramAndRequestAndResponseOperationId = openAPISpec.paramAndRequestAndResponse.map(
		(combination) => {
			return combination.operationId;
		}
	);

	let paramAndResponseOperationId = openAPISpec.paramAndResponseTypedArray.map(
		(combination) => {
			return combination.operationId;
		}
	);

	allOperationsId = [
		...requestAndResponseoperationId,
		...paramTypesoperationId,
		...paramAndRequestAndResponseOperationId,
		...paramAndResponseOperationId
	];

	allOperationsId = [...new Set(allOperationsId)];
	openAPISpec.onlyResponseCombinations = reject(
		openAPISpec.responseCombinations,
		(item) => {
			return allOperationsId.indexOf(item.operationId) > -1;
		}
	);
}


export function getSecurityAtPathLevelOrGlobalLevel(param) {
	let securityObject = openAPISpec.securityAtPathLevelObject.filter(
		(security) =>
			security.operationId == param.operationId &&
			security.security != undefined
	);

	let securityName = "";

	if (securityObject.length > 0) {
		securityName = Object.keys(securityObject[0].security[0] || {});
		securityName = securityName.length > 0 ? securityName[0] : "";
	} else {
		securityName = getSecurityAtGlobalLevel();
	}

	return securityName ? openAPISpec.securitySchemes[securityName] : "";
}

export function getSecurityAtGlobalLevel(data) {
	const firstObject = data ? data[0] : "";
	const keyName = firstObject != "" ? Object.keys(firstObject)[0] : "";
	return keyName;
}

export function getSecurityHeaderWithSchma(securitySchema) {
	let AuthHeader = {};
	switch (securitySchema.type) {
		case "http":
			AuthHeader = {
				security: { Authorization: "" + securitySchema.scheme },
				in: "header",
			};
			break;
		case "apiKey":
			// Logic for 'apiKey'
			// eslint-disable-next-line no-case-declarations
			let securityObj = {
				in: securitySchema.in,
				security: {},
			};
			securityObj.security[securitySchema.name] = "";

			AuthHeader = securityObj;
			break;
		case "oauth2":
			break;
		default:
			console.log("Unknown type: " + securitySchema.type);
			break;
	}
	return AuthHeader;
}

export function customStringify(obj, replacer = null, space = 2) {
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

export async function filterOutJSONBasedOnUpdateOptions(currentPathArrObject, options) {
	currentPathArrObject = filter(
		currentPathArrObject,
		(path) => {

			return options.some((option) => {
				if (path.operationId == option?.operationId || (path.tags == option.tags && option.methods.indexOf(path.methodName) > -1 && option.apiEndpoint == path.apiEndpoint)) {
					path["operation"] = option.operation
				}
				return path.operationId == option?.operationId || (path.tags == option.tags && option.methods.indexOf(path.methodName) > -1 && option.apiEndpoint == path.apiEndpoint)
			});
		}
	);
	return currentPathArrObject;
}


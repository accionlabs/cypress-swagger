import { stringify } from "flatted";

import { constants } from "../constants.js";
import {
	getFixtureObjectForPath,
	getOperationsForTag,
} from "../openAPIhelperMethods.js";
import { openAPISpec } from "../openAPISpec.js";
import { changeDirectory, writeFile } from "../util.js";

export async function writeDynamicTestCases() {
	changeDirectory("../e2e/API_TESTING");
	let tagFolders = openAPISpec.tagFolders;
	tagFolders.forEach((tag) => {
		let operations = getOperationsForTag(tag);
		changeDirectory(`${tag}`);
		operations.forEach((path) => {
			let fixtureObjectsList = getFixtureObjectForPath(path.operationId);
			let cypressFileName = `${path.operationId}${constants.cypressFileExtension}`;
			let requestInfo = JSON.stringify({
				url: `${path.apiEndpoint}`,
				method: path.methodName.toUpperCase(),
			});
			let itSummary = path.description ? path.description : path.apiEndpoint;
			let itTestBlock = ``;
			let itSyntax = path.deprecated
				? `it.skip('${itSummary}' ,()=>{`
				: `it('${itSummary}' ,()=>{`;
			let describeBlock = ``;

			if (fixtureObjectsList) {
				itTestBlock = getItTestCases(
					fixtureObjectsList.data,
					fixtureObjectsList.type,
					itSyntax
				);
			}

			describeBlock = ` const Ajv = require("ajv");
												const ajv = new Ajv();
												const apiBaseURL = Cypress.env("CYPRESS_BASE_URL");
												let requestInfo = JSON.parse(JSON.stringify(${requestInfo}));
												requestInfo.url = apiBaseURL + requestInfo.url;
												describe('${path.summary}', () => {
													${
														path.deprecated
															? "// Please be informed that the API in this file has been deprecated and will no longer be supported."
															: ""
													}
													${itTestBlock}
												});`;
			writeFile(cypressFileName, describeBlock);
		});
		changeDirectory("..");
	});
	changeDirectory("../../fixtures");
	writeFile("swagger.json", stringify(openAPISpec.swaggerParsedObject));
}

export function getItTestCases(fixtureObjectsList, type, itSyntax) {
	let itTestBlock = "";
	let apiRequestCodeBlock = `cy.request(requestInfo).then((response)=>{
                    expect(response.status).to.eq(parseInt(fixtureResponse.responseStatusCode));
										if(fixtureResponse.responseSchema &&  fixtureResponse.responseSchema!="")
										{
												const validate = ajv.compile(fixtureResponse.responseSchema);
												const isValid = validate(response.body);
												expect(isValid).to.be.true;
										}
								});`;
	let requestBodySyntax = `requestInfo.body = fixtureResponse.payload ? fixtureResponse.payload
			: "";`;
	let requestHeaderSyntax = `requestInfo.headers = fixtureResponse.headers ? fixtureResponse.headers
			: "" ;`;
	let queryParamSyntax = `requestInfo.qs = fixtureResponse.queryParam ? fixtureResponse.queryParam : "";`;
	let pathParamSyntax = `let pathParams = fixtureResponse.pathParam ? fixtureResponse.pathParam : "";											
			for (const key in pathParams) {
				if (pathParams.hasOwnProperty(key)) {
					const placeholder = '{'+key+'}';
					requestInfo.url = requestInfo.url.replace(new RegExp(placeholder, 'g'), pathParams[key]);
				}
			}`;
	let cookieSyntax = `requestInfo.cookies = fixtureResponse.cookie ? fixtureResponse.cookie : "";`;
	switch (type) {
		case "requestBody":
			fixtureObjectsList.forEach((combination) => {
				let fixtureFileName = combination.fixtureFileName;
				let fixtureSyntax = `cy.fixture("${fixtureFileName}").then((fixtureResponse) => {`;
				itTestBlock += `
					${itSyntax}
             ${fixtureSyntax}
                ${requestBodySyntax}
                ${requestHeaderSyntax}
								${apiRequestCodeBlock}
            });
					});
          `;
			});
			break;
		case "param":
			fixtureObjectsList.forEach((combination) => {
				let fixtureFileName = combination.fixtureFileName;

				let fixtureSyntax = `cy.fixture("${fixtureFileName}").then((fixtureResponse) => {`;
				itTestBlock += `${itSyntax}
																	${fixtureSyntax}
																		${requestBodySyntax}
																		${requestHeaderSyntax}
																		${combination.pathParam ? pathParamSyntax : "\n"}
																		${combination.queryParam ? queryParamSyntax : "\n"}
																		${combination.cookie ? cookieSyntax : "\n"}
																			${apiRequestCodeBlock}
																	});
																});
															`;
			});

			break;
		// Add more cases as needed
		case "paramRequestAndResponse":
			fixtureObjectsList.forEach((combination) => {
				let fixtureFileName = combination.fixtureFileName;
				let fixtureSyntax = `cy.fixture("${fixtureFileName}").then((fixtureResponse) => {`;

				itTestBlock += `${itSyntax}
																	${fixtureSyntax}
																		${requestBodySyntax}
																		${requestHeaderSyntax}
																		${combination.pathParam ? pathParamSyntax : "\n"}
																		${combination.queryParam ? queryParamSyntax : "\n"}
																		${combination.cookie ? cookieSyntax : "\n"}
																			${apiRequestCodeBlock}
																	});
																});
															`;
			});
			break;

		case "paramAndResponse":
			fixtureObjectsList.forEach((combination) => {
				let fixtureFileName = combination.fixtureFileName;
				let fixtureSyntax = `cy.fixture("${fixtureFileName}").then((fixtureResponse) => {`;

				itTestBlock += `${itSyntax}
																	${fixtureSyntax}
																		${requestBodySyntax}
																		${requestHeaderSyntax}
																		${combination.pathParam ? pathParamSyntax : "\n"}
																		${combination.queryParam ? queryParamSyntax : "\n"}
																		${combination.cookie ? cookieSyntax : "\n"}
																			${apiRequestCodeBlock}
																	});
																});
															`;
			});
			break;
	
		case "onlyResponseCombinations":
			fixtureObjectsList.forEach((responseCombinationOnly) => {
				let fixtureFileName = responseCombinationOnly.fixtureFileName;
				let fixtureSyntax = `cy.fixture("${fixtureFileName}").then((fixtureResponse) => {`;
				itTestBlock += `
						${itSyntax}
							${fixtureSyntax}
								${requestHeaderSyntax}
								${apiRequestCodeBlock}
							});
						});
						`;
			});
			break;
		default:
		// Code to execute when none of the cases match the expression
	}
	return itTestBlock;
}

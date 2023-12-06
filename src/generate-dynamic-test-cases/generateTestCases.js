import { fileURLToPath } from "url";
import { constants } from "../constants.js";
import {
	getFixtureObjectForPath,
	getOperationsForTag,
	customStringify
} from "../openAPIhelperMethods.js";
import { openAPISpec } from "../openAPISpec.js";
import {
	changeDirectory, writeFile, readFileAsync,
	writeFileAsync,
	deleteFile
} from "../util.js";


export async function writeDynamicTestCases() {
	if (constants.cmdArgs.operation == "CREATE") {
		await changeDirectory("../e2e/API_TESTING");
	}

	let tagFolders = openAPISpec.tagFolders;
	try {
		for (const tag of tagFolders) {
			let operations = await getOperationsForTag(tag);

			if (constants.cmdArgs.operation == "CREATE") {
				await changeDirectory(`${tag}`);
			}

			for (const path of operations) {
				let fixtureObjectsList = await getFixtureObjectForPath(path.operationId);
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
					itTestBlock = await getItTestCases(
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
							  ${path.deprecated
						? "// Please be informed that the API in this file has been deprecated and will no longer be supported."
						: ""}
							  ${itTestBlock}
							});`;

				if (constants.cmdArgs.operation == "UPDATE") {
					try {
						let filePath = constants.cmdArgs.swaggerOutputFilePath + "\\cypress\\e2e\\API_TESTING\\" + tag + "\\" + cypressFileName;
						await doUpdateTestCasesAsPerOperation(path.operation, filePath, constants.cmdArgs.swaggerOutputFilePath + "\\cypress\\e2e\\API_TESTING\\" + tag, describeBlock, cypressFileName);
					} catch (err) {
						console.error(`Error processing file ${cypressFileName}: ${err}`);
					}
				} else {
					await writeFile(cypressFileName, describeBlock);
				}
			}

			if (constants.cmdArgs.operation == "CREATE") {
				await changeDirectory("..");
			}
		}
	} catch (error) {
		console.error(`Error in processTagFolders: ${error}`);
	}

	// if (constants.cmdArgs.operation == "CREATE") {
	// 	changeDirectory("../../fixtures");
	// }

	// if(constants.cmdArgs.operation == "UPDATE")
	// {
	// 	changeDirectory(constants.cmdArgs.swaggerOutputFilePath+"\\cypress\\fixtures");
	// }


	// writeFile("swagger.json", JSON.stringify(openAPISpec.swaggerParsedObject));
}


export async function getItTestCases(fixtureObjectsList, type, itSyntax) {
	let itTestBlock = "";
	let apiRequestCodeBlock =
		`cy.request(requestInfo).then((response)=>{
                    expect(response.status).to.eq(parseInt(fixtureResponse.responseStatusCode));
										if(fixtureResponse.responseSchema &&  fixtureResponse.responseSchema!="")
										{
												const validate = ajv.compile(fixtureResponse.responseSchema);
												const isValid = validate(response.body);
												expect(isValid).to.be.true;
										}
								});`;

	let requestHeaderSyntax = `requestInfo.headers = fixtureResponse.headers ? fixtureResponse.headers
			: "" ;`;
	let requestBodySyntax = `requestInfo.body = fixtureResponse.payload ? fixtureResponse.payload
	: "";`;
	let queryParamSyntax = `requestInfo.qs = fixtureResponse.queryParam ? fixtureResponse.queryParam : "";`;
	let pathParamSyntax = `let pathParams = fixtureResponse.pathParam ? fixtureResponse.pathParam : "";											
			for (const key in pathParams) {
				if (pathParams.hasOwnProperty(key)) {
					const placeholder = '{'+key+'}';
					requestInfo.url = requestInfo.url.replace(new RegExp(placeholder, 'g'), pathParams[key]);
				}
			}`;
	let cookieSyntax = `requestInfo.cookies = fixtureResponse.cookie ? fixtureResponse.cookie : "";`;

	let fixtureSyntaxForFileUpload = `cy.fixture('**filePath**').then((fileContent) => {`;
	let requestBodySyntaxForFileUpload = `requestInfo.body = fileContent ? fileContent
	: "";`;
	let requestBodySyntaxForFileUploadForMultipartFormData = `const blob = new Blob([fileContent],{type : requestInfo.headers["Content-Type"]});
												const formData = new FormData();
												formData.append('file', blob);
												requestInfo.body = formData;`;

	switch (type) {
		case "requestBody":
			fixtureObjectsList.forEach((combination) => {
				let fixtureFileName = combination.fixtureFileName;
				let fileUploadOtherContentTypes = constants.contentTypesSupportsFileUploadAndDownload.indexOf(combination.contentType) > -1;
				let fileUploadMultipartFormDataFlag = combination.contentType == "multipart/form-data";
				let fixtureSyntax = `cy.fixture("${fixtureFileName}").then((fixtureResponse) => {`;

				itTestBlock += `
					${itSyntax}
             ${fixtureSyntax}
				${fileUploadOtherContentTypes || fileUploadMultipartFormDataFlag ? fixtureSyntaxForFileUpload : "\n"}
				${requestHeaderSyntax}
                ${fileUploadOtherContentTypes ? requestBodySyntaxForFileUpload : fileUploadMultipartFormDataFlag ? requestBodySyntaxForFileUploadForMultipartFormData : requestBodySyntax}
				${apiRequestCodeBlock}
            });
					});
					${fileUploadOtherContentTypes || fileUploadMultipartFormDataFlag ? "})" : "\n"}		
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
				let fileUploadOtherContentTypes = constants.contentTypesSupportsFileUploadAndDownload.indexOf(combination.contentType) > -1;
				let fileUploadMultipartFormDataFlag = combination.contentType == "multipart/form-data";

				itTestBlock += `${itSyntax}
																	${fixtureSyntax}
																	${fileUploadOtherContentTypes || fileUploadMultipartFormDataFlag ? fixtureSyntaxForFileUpload : "\n"}
																	${fileUploadOtherContentTypes ? requestBodySyntaxForFileUpload : fileUploadMultipartFormDataFlag ? requestBodySyntaxForFileUploadForMultipartFormData : requestBodySyntax}
																		${requestHeaderSyntax}
																		${combination.pathParam ? pathParamSyntax : "\n"}
																		${combination.queryParam ? queryParamSyntax : "\n"}
																		${combination.cookie ? cookieSyntax : "\n"}
																			${apiRequestCodeBlock}
																	});
																});
																${fileUploadOtherContentTypes || fileUploadMultipartFormDataFlag ? "})" : "\n"}
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

export async function createBackup(filePath, path) {
	// Read the contents of the existing file

	await changeDirectory(path);

	const fileData = await readFileAsync(filePath);
	const backupFilePath = `${filePath}__backup`;
	await writeFileAsync(backupFilePath, fileData);

	//   fs.readFileSync(filePath, 'utf8', async(err, data) => {
	//     if (err) {
	//       console.error(`Error reading file: ${err.message}`);
	//       return;
	//     }
	// 	console.log(process.cwd());
	// 	await changeDirectory(path);
	// 	// Create a backup file by appending a timestamp to the original file name
	//     const backupFilePath = `${filePath}__backup`;

	//     // Write the contents to the backup file
	//     fs.writeFileSync(backupFilePath, data, 'utf8', (err) => {
	//       if (err) {
	//         console.error(`Error creating backup: ${err.message}`);
	//         return;
	//       }

	//       console.log(`Backup created successfully at: ${backupFilePath}`);

	//     });
	//   });


}

async function doUpdateTestCasesAsPerOperation(type, path, fullPath, describeBlock, cypressFileName) {
	switch (type) {
		case "UPDATE":
			await createBackup(path, fullPath);
			await writeFile(path, describeBlock);
			break;
		case "DEPRECATED":
			// code to be executed if expression matches DEPRECATED
			// await changeDirectory(path);
			await writeFile(path, describeBlock);
			break;
		case "DELETE":
			// code to be executed if expression matches DELETE
			// await changeDirectory(path);
			await createBackup(path, fullPath);
			await deleteFile(path);
			break;
		case "CREATE":
			// code to be executed if expression matches CREATE
			//await createDirectory(`${tag}`)
			await changeDirectory(fullPath);
			await writeFile(cypressFileName, describeBlock);
			break;
		// more cases as needed
		default:
		// code to be executed if expression doesn't match any case
	}

}



import { constants } from "../constants.js";
import { writeDynamicTestCases } from "../generate-dynamic-test-cases/generateTestCases.js";
import {
	getOperationsForTag,
	getTagsFolders,
} from "../openAPIhelperMethods.js";
import { openAPISpec } from "../openAPISpec.js";
import {
	changeDirectory,
	concatFileName,
	createDirectory,
	executeCommandInCli,
	writeFile,
} from "../util.js";
import { createDataToSetInFixtureFile } from "./create-fixtures.js";

export async function createTagFolders(paths) {
	let tagFolders = getTagsFolders(paths);
	openAPISpec.tagFolders = tagFolders;
	tagFolders.forEach(async (tag) => {
		await createDirectory(`${tag}`, { recursive: true });
	});
	createOperationFiles();
}

export function createOperationFiles() {
	let tagFolders = openAPISpec.tagFolders;
	tagFolders.forEach((tag) => {
		let operations = getOperationsForTag(tag);
		changeDirectory(`${tag}`);
		operations.forEach((operation) => {
			let fileName =
				operation.operationId != undefined
					? operation.operationId
					: concatFileName(operation.apiEndpoint);
			writeFile(`${fileName}${constants.cypressFileExtension}`, "");
		});
		changeDirectory(`..`);
	});
}

export function createFilesAndFoldersForTagsAndOperations() {
	checkIfOpertionIdMissedAndAssignApiEndpoint();
	createTagFolders(openAPISpec.SwaggerPathArrObject);
	createDataToSetInFixtureFile();
	writeDynamicTestCases();
	formatAllFilesInProject();
}

export async function formatAllFilesInProject() {
	await changeDirectory("../../");
	try {
		await executeCommandInCli(constants.pretterierFormatAllFiles, {
			stdio: "inherit",
		});
	} catch {
		console.log("files formatted");
	}
}

export function checkIfOpertionIdMissedAndAssignApiEndpoint() {
	openAPISpec.SwaggerPathArrObject.forEach((path, index) => {
		openAPISpec.SwaggerPathArrObject[index].operationId =
			path.operationId != undefined
				? path.operationId
				: concatFileName(path.apiEndpoint);
	});
}

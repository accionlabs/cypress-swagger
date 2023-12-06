import { constants } from "../constants.js";
import { writeDynamicTestCases } from "../generate-dynamic-test-cases/generateTestCases.js";
import {
	getOperationsForTag,
	getTagsFolders,
} from "../openAPIhelperMethods.js";
import { openAPISpec } from "../openAPISpec.js";
import {
	changeDirectory,
	checkIfFolderExists,
	concatFileName,
	createDirectory,
	executeCommandInCli,
	writeFile,
} from "../util.js";
import { createDataToSetInFixtureFile } from "./create-fixtures.js";
import fs from 'fs';
import jsonfile from 'jsonfile';
import yaml from 'js-yaml';

export async function createTagFolders(paths) {
	let tagFolders = await getTagsFolders(paths);
	openAPISpec.tagFolders = tagFolders;
	if (constants.cmdArgs.operation == "CREATE") {
		tagFolders.forEach(async (tag) => {
			await createDirectory(`${tag}`, { recursive: true });
		});
		await createOperationFiles();
	}

	if (constants.cmdArgs.operation == "UPDATE") {
		tagFolders.forEach(async (tag) => {
			if (!await checkIfFolderExists(`${constants.cmdArgs.swaggerOutputFilePath}\\cypress\\e2e\\API_TESTING\\${tag}\\`)) {
				console.log("Inside tag UPDATE..");
				await createDirectory(`${constants.cmdArgs.swaggerOutputFilePath}\\cypress\\e2e\\API_TESTING\\${tag}\\`, { recursive: true });
			}
		});
	}
}

export async function createOperationFiles() {
	let tagFolders = openAPISpec.tagFolders;

	for (const tag of tagFolders) {
		let operations = await getOperationsForTag(tag);
		await changeDirectory(`${tag}`);

		for (const operation of operations) {
			let fileName =
				operation.operationId !== undefined
					? operation.operationId
					: concatFileName(operation.apiEndpoint);
			await writeFile(`${fileName}${constants.cypressFileExtension}`, "");
		}

		await changeDirectory(`..`);
	}
}


export async function createFilesAndFoldersForTagsAndOperations() {
	await checkIfOpertionIdMissedAndAssignApiEndpoint();
	await createTagFolders(openAPISpec.SwaggerPathArrObject)
		.then(async () => {
			await createDataToSetInFixtureFile()
				.then(async () => {
					await writeDynamicTestCases()
						.then(async () => {
							const originalFilePath = constants.swaggerFilePath;
							const newFilePath = `${constants.cmdArgs.swaggerOutputFilePath}//cypress//fixtures//swagger.json`;
							await copyFile(originalFilePath, newFilePath);
						});
				})
				.catch((err) => {
					console.log("Error occured whil setting data in fixture files.", err);
				})
		})


}

export async function checkIfOpertionIdMissedAndAssignApiEndpoint() {
	openAPISpec.SwaggerPathArrObject.forEach(async (path, index) => {
		openAPISpec.SwaggerPathArrObject[index].operationId = await
			path.operationId != undefined
			? path.operationId
			: concatFileName(path.apiEndpoint);
	});
}

async function copyFile(filePath, newFilePath) {
	try {
		// Read the content of the file
		const fileContent = fs.readFileSync(filePath, 'utf-8');

		// Detect file format (JSON or YAML)
		const isJson = filePath.endsWith('.json');
		const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');

		// Parse the content based on the detected format
		let parsedContent;
		if (isJson) {
			parsedContent = JSON.parse(fileContent);
		} else if (isYaml) {
			parsedContent = yaml.safeLoad(fileContent);
		} else {
			throw new Error('Unsupported file format');
		}

		// Write the parsed content to a new file in the same format
		if (isJson) {
			jsonfile.writeFileSync(newFilePath, parsedContent, { spaces: 2 });
		} else if (isYaml) {
			const yamlContent = yaml.dump(parsedContent, { lineWidth: -1 });
			fs.writeFileSync(newFilePath, yamlContent);
		}
		console.log('File copied successfully!');
	} catch (err) {
		console.error('Error copying file:', err);
	}
}
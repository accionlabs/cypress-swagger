import SwaggerParser from "@apidevtools/swagger-parser";
import fs from "fs";
import { constants } from "../constants.js";
import { createCypressFolderStructure } from "../cypress-folder-structure/cypress-folders.js";
import {
	convertPathIntoArrayOfObjects,
	flattenPathObject,
	filterOutJSONBasedOnUpdateOptions
} from "../openAPIhelperMethods.js";
import { openAPISpec } from "../openAPISpec.js";
import { checkAndSetServerURLData, validateServerURL } from "./serverCheck.js";
import { changeDirectory, executeCommandInCli, executeGitCommand, checkGitStatus } from "../util.js";
import { execSync } from "child_process";
import { authenticate, raisePullRequest } from "../git-operations/git-flow.js";

async function validateServers() {
	if (
		openAPISpec.swaggerParsedObject.servers == undefined ||
		openAPISpec.swaggerParsedObject.servers.length == 0
	) {
		console.log(
			"servers are not mentioned in the Swagger file please update the servers."
		);
		process.exit(0);
	}
}

async function checkIfCommandLineArgs() {
	// if (constants.swaggerPathFile == undefined || constants.swaggerPathFile == "") {
	// 	console.log("Swagger file is not passed in command line arguments.");
	// 	process.exit(0);
	// }

	if (constants.projectPath == undefined || constants.projectPath == "") {
		console.log("File path to save cypress project is not provided.");
		process.exit(0);
	}

	if (constants.serverUrl == undefined || constants.serverUrl == "") {
		console.error("Please provide a server URL as a command line argument.");
		process.exit(0);
	}
}

// Helper function to generate URL combinations for a server object
async function generateURLCombinations(server) {
	if (!server.variables) {
		return [server.url];
	}

	const { username, port, basePath } = server.variables;
	const urlCombinations = [];

	for (const user of username.enum || [username.default]) {
		for (const p of port.enum || [port.default]) {
			for (const path of basePath.enum || [basePath.default]) {
				const url = server.url
					.replace("{username}", user)
					.replace("{port}", p)
					.replace("{basePath}", path);
				urlCombinations.push(url);
			}
		}
	}

	return urlCombinations;
}

async function getSecuritySchema() {
	let securitySchema =
		openAPISpec.swaggerParsedObject?.components &&
			openAPISpec.swaggerParsedObject?.components?.securitySchemes
			? openAPISpec.swaggerParsedObject?.components?.securitySchemes
			: undefined;

	openAPISpec.securitySchemes = securitySchema ? securitySchema : [];
}

async function getSecurityFromPathLevelObject() {
	let securityLevelPathArrObject = [];
	openAPISpec.SwaggerPathArrObject?.forEach((path) => {
		let security = path?.security ? path?.security : undefined;
		let obj = {
			operationId: path.operationId,
		};

		if (security) obj.security = security;
		securityLevelPathArrObject.push(obj);
	});
	openAPISpec.securityAtPathLevelObject = securityLevelPathArrObject;
}

async function readJsonFile(filePath) {
	try {
		// Read the contents of the file
		const data = await fs.readFileSync(filePath, 'utf8');

		// Parse the JSON data
		const jsonData = JSON.parse(data);

		// Now you can work with the parsed data

		// Return the parsed data if needed
		return jsonData;
	} catch (error) {
		console.error('Error reading or parsing JSON file:', error);

		// You might want to throw the error or handle it appropriately
		throw error;
	}
}

export async function initiateSwaggerToCypress() {
	await checkIfOperationIsUpdateAndSetConstants();
	await checkIfCommandLineArgs();

	openAPISpec.swaggerParsedObject = await SwaggerParser.parse(constants.swaggerPathFile);
	openAPISpec.swaggerParsedObject = await SwaggerParser.dereference(
		openAPISpec.swaggerParsedObject
	);
	openAPISpec.SwaggerPathArrObject = await convertPathIntoArrayOfObjects(
		openAPISpec.swaggerParsedObject.paths,
		"apiEndpoint"
	);
	await getSecuritySchema();
	openAPISpec.security = await openAPISpec.swaggerParsedObject?.security
		? openAPISpec.swaggerParsedObject?.security
		: undefined;

	openAPISpec.SwaggerPathArrObject = await flattenPathObject(
		openAPISpec.SwaggerPathArrObject
	);

	await filterDataBasedOnOperation(constants.operation);
	// set security schema as per operation id
	await getSecurityFromPathLevelObject();

	// check if parsed swagger object consist of server or not.
	await validateServers();

	// Generate URL combinations for each server
	openAPISpec.allURLCombinations = await openAPISpec.swaggerParsedObject.servers.map(
		generateURLCombinations
	);

	openAPISpec.allURLCombinations = await openAPISpec.allURLCombinations.flat();

	//validate if base url received or not
	await validateServerURL(constants.serverUrl);
	// set Base URL
	await checkAndSetServerURLData(constants.serverUrl);
	// create cypress folder structure
	await createCypressFolderStructure()
		.then(async () => {
			await formatAllFilesInProject();
			console.log("Cypress project got created..");
			const gitStatus = await checkGitStatus(`git status`);
			if (gitStatus) {


				await executeGitCommand(`git add -A .`, `Attachments added.`);
				console.log(`before changing commit message ${constants.commitMessageToPushInRepo}`);
				constants.commitMessageToPushInRepo = `${constants.branchName} ${constants.commitMessageToPushInRepo}`;
				console.log(`after changing commit message ${constants.commitMessageToPushInRepo}`);
				await executeGitCommand(`git commit -m "${constants.commitMessageToPushInRepo}"`, `Changes committed.`);
				await executeGitCommand(`git push origin ${constants.branchName}`, `Changes pushed to remote.`);
				const octokit = await authenticate();
				console.log('authenticated to github through api succesfully');
				await raisePullRequest(octokit);
			}
			else {
				console.log("No changes to commit.");
				return;
			}
		})
		.catch((err) => {
			console.error("Error:", err);
			// process.exit(1);
			throw err;
		});
}


export async function filterDataBasedOnOperation(type) {
	if (type == "UPDATE") {
		openAPISpec.SwaggerPathArrObject = await filterOutJSONBasedOnUpdateOptions(openAPISpec.SwaggerPathArrObject, constants.updateInfo);
	}
}




export async function formatAllFilesInProject() {
	await changeDirectory(constants.fullPathOfSwaggerGitProject);
	try {
		await executeCommandInCli(constants.pretterierFormatAllFiles, {
			stdio: "inherit",
		});
	} catch {
		console.log("files formatted");
	}
}


async function checkIfOperationIsUpdateAndSetConstants() {

	if (constants.configFilePath != "") {
		readJsonFile(constants.configFilePath)
			.then(async (data) => {
				constants.operation = data.operation;
				constants.projectPath = `${process.env.SWAGGER_OUTPUT_FILE_PATH}`;
				constants.updateInfo = data.updateInfo;
			});
	}

}
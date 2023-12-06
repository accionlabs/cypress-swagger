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
import { changeDirectory, executeCommandInCli } from "../util.js";
let config = {};

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

async function checkIfCommandLineArgs(config) {
	if (config.swaggerPathFile == undefined || config.swaggerPathFile == "") {
		console.log("Swagger file is not passed in command line arguments.");
		process.exit(0);
	}

	if (config.swaggerOutputFilePath == undefined || config.swaggerOutputFilePath == "") {
		console.log("File path to save cypress project is not provided.");
		process.exit(0);
	}

	if (config.serverUrl == undefined || config.serverUrl == "") {
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

export async function initiateSwaggerToCypress(args) {
	// check command line arguments are passed or not
	readJsonFile(args[0])
		.then(async (data) => {
			config = data;
			constants.cmdArgs = config;
			await checkIfCommandLineArgs(config);
			constants.swaggerFilePath = await config.swaggerPathFile;
			openAPISpec.swaggerParsedObject = await SwaggerParser.parse(config.swaggerPathFile);
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

			// console.log(openAPISpec.SwaggerPathArrObject);	

			await filterDataBasedOnOperation(config.operation);
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
			await validateServerURL(config.serverUrl);
			// set Base URL
			await checkAndSetServerURLData(config.serverUrl);
			// set cypress project path
			constants.projectPath = await config.swaggerOutputFilePath;

			// create cypress folder structure
			await createCypressFolderStructure()
				.then(async () => {
					await formatAllFilesInProject();
					console.log("Cypress project got created..");
				})
				.catch((err) => {
					console.error("Error:", err);
				});
		})
		.catch((error) => {
			console.log("can't JSON config file", error);
		});
}


export async function filterDataBasedOnOperation(type) {
	if (type == "UPDATE")
		openAPISpec.SwaggerPathArrObject = await filterOutJSONBasedOnUpdateOptions(openAPISpec.SwaggerPathArrObject, config.updateInfo);

}

export async function formatAllFilesInProject() {
	await changeDirectory("../../");
	try {
		console.log('inside format...');
		await executeCommandInCli(constants.pretterierFormatAllFiles, {
			stdio: "inherit",
		});
	} catch {
		console.log("files formatted");
	}
}
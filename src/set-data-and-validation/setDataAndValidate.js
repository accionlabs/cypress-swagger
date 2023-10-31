import SwaggerParser from "@apidevtools/swagger-parser";

import { constants } from "../constants.js";
import { createCypressFolderStructure } from "../cypress-folder-structure/cypress-folders.js";
import {
	convertPathIntoArrayOfObjects,
	flattenPathObject,
} from "../openAPIhelperMethods.js";
import { openAPISpec } from "../openAPISpec.js";
import { checkAndSetServerURLData, validateServerURL } from "./serverCheck.js";

function validateServers() {
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

function checkIfCommandLineArgs(args) {
	if (args[0] == undefined || args[0] == undefined) {
		console.log("Swagger file is not passed in command line arguments.");
		process.exit(0);
	}

	if (args[1] == undefined || args[1] == undefined) {
		console.log("File path to save cypress project is not provided.");
		process.exit(0);
	}

	if (args[2] == undefined || args[2] == undefined) {
		console.error("Please provide a server URL as a command line argument.");
		process.exit(0);
	}
}

// Helper function to generate URL combinations for a server object
function generateURLCombinations(server) {
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

function getSecuritySchema() {
	let securitySchema =
		openAPISpec.swaggerParsedObject?.components &&
		openAPISpec.swaggerParsedObject?.components?.securitySchemes
			? openAPISpec.swaggerParsedObject?.components?.securitySchemes
			: undefined;

	openAPISpec.securitySchemes = securitySchema ? securitySchema : [];
}

function getSecurityFromPathLevelObject() {
	let securityLevelPathArrObject = [];
	openAPISpec.SwaggerPathArrObject.forEach((path) => {
		let security = path?.security ? path?.security : undefined;
		let obj = {
			operationId: path.operationId,
		};

		if (security) obj.security = security;
		securityLevelPathArrObject.push(obj);
	});
	openAPISpec.securityAtPathLevelObject = securityLevelPathArrObject;
}

export async function initiateSwaggerToCypress(args) {
	// check command line arguments are passed or not
	checkIfCommandLineArgs(args);

	openAPISpec.swaggerParsedObject = await SwaggerParser.parse(args[0]);
	openAPISpec.swaggerParsedObject = await SwaggerParser.dereference(
		openAPISpec.swaggerParsedObject
	);
	openAPISpec.SwaggerPathArrObject = await convertPathIntoArrayOfObjects(
		openAPISpec.swaggerParsedObject.paths,
		"apiEndpoint"
	);

	getSecuritySchema();

	openAPISpec.security = openAPISpec.swaggerParsedObject?.security
		? openAPISpec.swaggerParsedObject?.security
		: undefined;

	openAPISpec.SwaggerPathArrObject = flattenPathObject(
		openAPISpec.SwaggerPathArrObject
	);

	// set security schema as per operation id
	getSecurityFromPathLevelObject();

	// check if parsed swagger object consist of server or not.
	validateServers();

	// Generate URL combinations for each server
	openAPISpec.allURLCombinations = openAPISpec.swaggerParsedObject.servers.map(
		generateURLCombinations
	);
	openAPISpec.allURLCombinations = openAPISpec.allURLCombinations.flat();

	//validate if base url received or not
	validateServerURL(args[2]);
	// set Base URL
	checkAndSetServerURLData(args[2]);
	// set cypress project path
	constants.projectPath = args[1];

	// create cypress folder structure
	createCypressFolderStructure()
		.then(() => {
			console.log("Cypress project got created..");
		})
		.catch((err) => {
			console.error("Error:", err);
		});
}

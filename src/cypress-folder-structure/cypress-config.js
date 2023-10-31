import { constants } from "../constants.js";
import { openAPISpec } from "../openAPISpec.js";
import { writeFile } from "../util.js";

export function createConfigFile() {
	let configContent = constants.cypressConfig;
	configContent = configContent.replace(
		"CYPRESS_BASE_URL_PLACEHOLDER",
		openAPISpec.baseApiURL
	);
	writeFile("cypress.config.js", configContent);
	console.log(`cypress.config.js created successfully.`);
}

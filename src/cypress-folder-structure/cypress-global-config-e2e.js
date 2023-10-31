import { constants } from "../constants.js";
import { writeFile } from "../util.js";

export function createGlobalConfigE2e() {
	const globalConfig = constants.globalConfig;
	writeFile("e2e.js", globalConfig);
	console.log(`e2e.js created successfully.`);
}

import { constants } from "../constants.js";
import { writeFile } from "../util.js";

export async function createGlobalConfigE2e() {
	const globalConfig = constants.globalConfig;
	await writeFile("e2e.js", globalConfig);
	console.log(`e2e.js created successfully.`);
}

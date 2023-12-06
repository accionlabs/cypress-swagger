import { constants } from "../constants.js";
import { writeFile } from "../util.js";

export async function createCustomCommandsConfig() {
	const customCommands = constants.customCommands;
	await writeFile("commands.js", customCommands);
	console.log(`commands.js created successfully.`);
}

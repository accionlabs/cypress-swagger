import { constants } from "../constants.js";
import { writeFile } from "../util.js";

export function createCustomCommandsConfig() {
	const customCommands = constants.customCommands;
	writeFile("commands.js", customCommands);
	console.log(`commands.js created successfully.`);
}

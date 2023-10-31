import { execSync } from "child_process";
import fs from "fs";

export async function writeFile(fileName, data) {
	await fs.writeFileSync(fileName, data);
}

export async function createDirectory(folderPath, config) {
	await fs.mkdirSync(folderPath, config);
}

export function checkIfFolderExists(path) {
	return fs.existsSync(path);
}

export async function changeDirectory(path) {
	await process.chdir(path);
}

export async function executeCommandInCli(command, config) {
	await execSync(command, config);
}

export function concatFileName(url) {
	return url
		? url
				.substring(1, url.length)
				.replaceAll("/", "_")
				.replace("{", "")
				.replace("}", "")
		: url;
}

export async function readFile(fileName) {
	let swaggerObj = "";
	fs.readFile(fileName, async (err, data) => {
		// If there is any error this line will execute
		if (err) throw err;
		swaggerObj = await JSON.parse(data);
	});
	return await swaggerObj;
}

export async function appendFile(path, data) {
	try {
		await fs.appendFile(path, data);
	} catch (error) {
		console.error(error);
	}
}

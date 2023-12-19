import { execSync } from "child_process";
import fs from 'fs';

export async function writeFile(fileName, data) {
	//if (!await checkIfFolderExists(fileName)) {
	await fs.writeFileSync(fileName, data);
	// }
}

export async function createDirectory(folderPath, config) {
	if (!await checkIfFolderExists(folderPath)) {
		await fs.mkdirSync(folderPath, config);
	}
}

export async function checkIfFolderExists(path) {
	return await fs.existsSync(path);
}

export async function changeDirectory(path) {
	//if (await checkIfFolderExists(path)) {
	process.chdir(path);
	// }

}

export async function createDirIfDoesntExist(path) {
	if (!await checkIfFolderExists(path)) {
		await createDirectory(path);
		await changeDirectory(path);
	}
	else {
		await changeDirectory(path);
	}
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
		throw error;
	}
}

export async function writeFileAsync(filePath, data) {
	await fs.writeFileSync(filePath, data);
}

export async function readFileAsync(filePath) {
	const data = await fs.readFileSync(filePath);
	return data;
}

export async function deleteFile(filePath) {
	try {
		// Use fs.unlinkSync to delete the file synchronously
		console.log(await checkIfFolderExists(filePath));
		if (await checkIfFolderExists(filePath)) {
			await fs.unlinkSync(filePath);
			console.log('File deleted successfully');
		}
		else {
			console.log(`File "${filePath}" does not exist or already deleted.`);
		}
	} catch (err) {
		console.error('Error deleting file:', err);
		throw err;
	}
}

export async function executeGitCommand(command, message) {
	try {
		await execSync(command);
		console.log(message);
	} catch (error) {
		console.error(`Error while executing "${command}":`, error);
		// process.exit(1);
		throw error;
	}
}


export async function removeFolder(folderPath) {
	try {
		if (await checkIfFolderExists(folderPath)) {
			await fs.rmSync(folderPath, { recursive: true });
			console.log('Folder and its contents removed successfully.');
		} else {
			console.log('Folder does not exist.');
		}
	} catch (error) {
		console.error('Error while removing folder :', error.message);
	}
}

export async function checkGitStatus(command) {
	try {
		const result = execSync(`${command}`, { encoding: 'utf-8' }).toString();
		return !result.includes('nothing to commit, working tree clean');
	} catch (error) {
		console.error('Error:', error.stderr.toString());
	}
}
import { constants } from "../constants.js";
import { createFilesAndFoldersForTagsAndOperations } from "../create-path-folder-files/cypress-files.js";
import {
	changeDirectory,
	checkIfFolderExists,
	createDirectory,
	executeCommandInCli,
	writeFile,
} from "../util.js";
import { createConfigFile } from "./cypress-config.js";
import { createCustomCommandsConfig } from "./cypress-custom-commands-config.js";
import { createGlobalConfigE2e } from "./cypress-global-config-e2e.js";
import { createReportConfig } from "./cypress-report-config.js";
import path from 'path';
import fs from "fs";

export async function createFolders(folders, parentDirectory) {
	folders.forEach(async (folderName) => {
		const folderPath = `${parentDirectory}/${folderName}`;
		await createDirectory(folderPath, { recursive: true });
		console.log(`Folder ${folderPath} created successfully.`);
	});
}

export async function createCypressFolderStructure() {
	try {
		if (!await checkIfFolderExists(constants.projectPath)) {
			await createDirectory(constants.projectPath);
			await changeDirectory(constants.projectPath);
			await executeCommandInCli(constants.npmPackage, { stdio: "inherit" });
			await executeCommandInCli(constants.cypressPackage, { stdio: "inherit" });
			await executeCommandInCli(constants.ajyPackage, { stdio: "inherit" });
			await executeCommandInCli(constants.pretteierPackage, {
				stdio: "inherit",
			});
			await executeCommandInCli(constants.reportingPackages, {
				stdio: "inherit",
			});
			await writeFile(".prettierrc.json", constants.pretteierConfig);
			const packageJsonPath = path.join(process.cwd(), 'package.json');
			await readAndWriteFile(packageJsonPath);
			console.log(`Cypress project initialized successfully `);
			await createDirectory("cypress");
			await createConfigFile();
			await createReportConfig();
			await changeDirectory("cypress");
			await createFolders(
				constants.cypressFoldersName,
				constants.cypressParentDirectory
			);
			await changeDirectory("./support");
			await createCustomCommandsConfig();
			await createGlobalConfigE2e();
			await changeDirectory("../e2e");
			await createDirectory("API_TESTING");
			await changeDirectory("API_TESTING");
			await createFilesAndFoldersForTagsAndOperations();
		} else {
			await createFilesAndFoldersForTagsAndOperations();
		}
	} catch (err) {
		console.log("something went wrong while creating folder.");
		console.error(err);
	}
}


async function readAndWriteFile(packageJsonPath) {
	fs.readFile(packageJsonPath, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading package.json:', err);
			return;
		}
		let reportRun = constants.cypressRunAndGenerateReportCommand;
		// Parse the JSON content
		const packageJson = JSON.parse(data);

		// Edit the package.json as needed
		packageJson.scripts.test = constants.cypressRunCommand; // Example: Adding a new dependency
		packageJson.scripts = { ...reportRun, ...packageJson.scripts };
		// Convert the modified object back to JSON
		const updatedPackageJson = JSON.stringify(packageJson, null, 2); // The third argument (2) is the number of spaces to use for indentation

		// Write the updated content back to package.json
		fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8', (err) => {
			if (err) {
				console.error('Error writing package.json:', err);
			} else {
				console.log('package.json updated successfully!');
			}
		});
	});
}
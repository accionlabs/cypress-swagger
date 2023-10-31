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

export function createFolders(folders, parentDirectory) {
	folders.forEach((folderName) => {
		const folderPath = `${parentDirectory}/${folderName}`;
		createDirectory(folderPath, { recursive: true });
		console.log(`Folder ${folderPath} created successfully.`);
	});
}

export async function createCypressFolderStructure() {
	try {
		if (!checkIfFolderExists(constants.projectPath)) {
			await createDirectory(constants.projectPath);
			await changeDirectory(constants.projectPath);
			await executeCommandInCli(constants.npmPackage, { stdio: "inherit" });
			await executeCommandInCli(constants.cypressPackage, { stdio: "inherit" });
			await executeCommandInCli(constants.ajyPackage, { stdio: "inherit" });
			await executeCommandInCli(constants.pretteierPackage, {
				stdio: "inherit",
			});
			await writeFile(".prettierrc.json", constants.pretteierConfig);
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
			console.log("Folder is already created with name is given in arguments.");
			process.exit(0);
		}
	} catch (err) {
		console.log("something went wrong while creating folder.");
		console.error(err);
	}
}

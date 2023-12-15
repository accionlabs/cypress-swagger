import { constants } from "../constants.js";
import { createFilesAndFoldersForTagsAndOperations } from "../create-path-folder-files/cypress-files.js";
import {
	changeDirectory,
	createDirectory,
	executeCommandInCli,
	writeFile,
	removeFolder,
	createDirIfDoesntExist,
	executeGitCommand,
	writeFileAsync,
	readFileAsync
} from "../util.js";
import { createConfigFile } from "./cypress-config.js";
import { createCustomCommandsConfig } from "./cypress-custom-commands-config.js";
import { createGlobalConfigE2e } from "./cypress-global-config-e2e.js";
import { createReportConfig } from "./cypress-report-config.js";
import path from 'path';
import fs from "fs";
import { cloneRepository } from "../git-operations/git-flow.js";

export async function createFolders(folders, parentDirectory) {
	await folders.forEach(async (folderName) => {
		const folderPath = `${parentDirectory}/${folderName}`;
		await createDirectory(folderPath, { recursive: true });
		console.log(`Folder ${folderPath} created successfully.`);
	});
}

export async function createCypressFolderStructure() {
	try {
		const gitUserName = process.env.GIT_USER_NAME;
		const githubToken = process.env.GITHUB_TOKEN;
		const command = `git config --global credential.helper '!f() { echo "username=${gitUserName}"; echo "password=${githubToken}"; }; f'`;
		if (constants.operation == "CREATE") {
			await createDirIfDoesntExist(constants.projectPath);
			await removeFolder(constants.repoName);
			await executeGitCommand(`git config --global user.name "${process.env.GIT_USER_NAME}"`);
			await executeGitCommand(`git config --global user.email "${process.env.GIT_USER}"`);
			await cloneRepository();
			await changeDirectory(constants.repoName);
			console.log(await process.cwd());
			// await executeGitCommand(`git config credential.helper '!f() {echo "username=${process.env.GIT_USER_NAME}"; echo "password=${process.env.GITHUB_TOKEN}"; }; f'`);
			await executeGitCommand(command, { stdio: 'inherit' });


			await executeGitCommand(`git checkout -b ${constants.branchName} ${constants.masterBranchName}`, `New branch "${constants.branchName}" created.`);
			await executeCommandInCli(constants.npmPackage, { stdio: "inherit" });
			// await executeCommandInCli(constants.cypressPackage, { stdio: "inherit" });
			// await executeCommandInCli(constants.ajyPackage, { stdio: "inherit" });
			// await executeCommandInCli(constants.pretteierPackage, {
			// 	stdio: "inherit",
			// });
			// await executeCommandInCli(constants.reportingPackages, {
			// 	stdio: "inherit",
			// });
			await writeFile(".prettierrc.json", constants.pretteierConfig);
			await writeFile("Dockerfile", constants.dockerFileConfig);
			await writeFile(".dockerignore", constants.dockerGitignoreConfig);
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
			await changeDirectory(constants.projectPath);
			await removeFolder(constants.repoName);
			await executeGitCommand(`git config --global user.name "${process.env.GIT_USER_NAME}"`);
			await executeGitCommand(`git config --global user.email "${process.env.GIT_USER}"`);
			await cloneRepository();
			await changeDirectory(constants.repoName);
			await executeGitCommand(command, { stdio: 'inherit' });
			await executeGitCommand(`git checkout -b ${constants.branchName} ${constants.masterBranchName}`, `New branch "${constants.branchName}" created.`);
			const packageJsonPath = path.join(process.cwd(), 'package.json');
			await readAndWriteFile(packageJsonPath);
			await createFilesAndFoldersForTagsAndOperations();
		}
	} catch (err) {
		console.log("something went wrong while creating folder.");
		console.error(err);
		throw err;
	}
}

async function readAndWriteFile(packageJsonPath) {
	try {
		const packageJsonData = await readFileAsync(packageJsonPath);
		const reportRun = constants.cypressRunAndGenerateReportCommand;
		// Parse the JSON content
		const packageJson = await JSON.parse(packageJsonData);
		// Edit the package.json as needed
		// packageJson.scripts.test = await constants.cypressRunCommand; // Example: Adding a new dependency
		packageJson.scripts = constants.cypressRunAndGenerateReportCommand;
		packageJson["dependencies"] = constants.cypressDependenciesPackages;
		packageJson["devDependencies"] = constants.cypressDevDependenciesPackages;
		packageJson["type"] = "module";
		// Convert the modified object back to JSON
		const updatedPackageJson = JSON.stringify(packageJson, null, 2);
		await writeFileAsync("package.json", updatedPackageJson);
	}
	catch (err) {
		console.log("something went wrong while updating package.json.");
		console.error(err);
		throw err;
	}
}
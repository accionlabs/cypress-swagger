import { execSync } from 'child_process';
import { Octokit } from '@octokit/rest';
import { constants } from '../constants.js';
import { executeGitCommand } from '../util.js';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export async function authenticate() {

    if (!GITHUB_TOKEN) {
        console.error('GitHub token is not set in the environment variable.');
        process.exit(1);
    }

    return new Octokit({
        auth: GITHUB_TOKEN,
    });
}

export async function cloneRepository() {
    try {
        console.log(`Cloning repository: ${constants.repoName}`);
        await execSync(`git clone https://${GITHUB_TOKEN}@github.com/${process.env.REPO_OWNER}/${constants.repoName}.git`);
        // await execSync(`git clone ${constants.repoUrlInWhichOutputTobePushed} ${constants.repoName}`);
        console.log('Repository cloned successfully');
    } catch (error) {
        console.error('Error cloning repository:', error);
        throw error;
    }

};

export async function raisePullRequest(octokit) {
    let pullRequestUrl = '';
    let owner = constants.repoOwner;
    let repo = constants.repoName;

    try {
        const response = await octokit.pulls.create({
            owner,
            repo,
            title: `The PR raised by the codegen corresponds to the "${constants.branchName}" story.`,
            head: `${constants.branchName}`,
            base: `${constants.masterBranchName}`,
            body: 'Description of the changes',
        });

        pullRequestUrl = response.data.html_url;

        console.log('Pull request created:', pullRequestUrl);
    } catch (error) {
        console.error('Error creating pull request:', error.message);
        // process.exit(1);
        throw error;
    }
}

export async function setGitCredentialsLocally() {
    const gitUserName = process.env.GIT_USER_NAME;
    const githubToken = process.env.GITHUB_TOKEN;
    const command = `git config --local credential.helper '!f() { echo "username=${gitUserName}"; echo "password=${githubToken}"; }; f'`;
    await executeGitCommand(`git config --local user.name "${process.env.GIT_USER_NAME}"`);
    await executeGitCommand(`git config --local user.email "${process.env.GIT_USER}"`);
    await executeGitCommand(command, { stdio: 'inherit' });
}
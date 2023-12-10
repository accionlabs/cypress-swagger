import { execSync } from 'child_process';
import { Octokit } from '@octokit/rest';
import { constants } from '../constants.js';
import { changeDirectory } from '../util.js';
// import { config } from "dotenv";

export async function authenticate() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GITHUB_TOKEN) {
        console.error('GitHub token is not set in the environment variable.');
        process.exit(1);
    }

    return new Octokit({
        auth: GITHUB_TOKEN,
    });
}

export async function cloneRepository() {
    const projectDir = constants.repoUrlInWhichOutputTobePushed.split('/').pop();
    constants.repoNameForOutputGeneration = projectDir.substring(0, projectDir.length - 4);
    try {
        console.log(`Cloning repository: ${constants.repoUrlInWhichOutputTobePushed}`);
        await execSync(`git clone ${constants.repoUrlInWhichOutputTobePushed}`);
        console.log('Repository cloned successfully');
    } catch (error) {
        console.error('Error cloning repository:', error);
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
            title: 'Pull Request Title',
            head: `${constants.branchName}`,
            base: `${constants.masterBranchName}`,
            body: 'Description of the changes',
        });

        pullRequestUrl = response.data.html_url;

        console.log('Pull request created:', pullRequestUrl);
    } catch (error) {
        console.error('Error creating pull request:', error.message);
    }
}


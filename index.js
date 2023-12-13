import axios from "axios";
import dotenv from 'dotenv';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { initCodeGen } from "./main.js";
import { constants } from "./src/constants.js";
import { writeFile } from "./src/util.js";

const environment = process.env.ENV || "development";
console.log(`environment is ${environment}`);
dotenv.config({
    path: `./.env.${environment}`
});


const jiraBaseUrl = process.env.JIRA_BASE_URL;
const downloadDir = process.env.SWAGGER_OUTPUT_FILE_PATH;
const authHeader = process.env.AUTH_HEADER_FOR_JIRA;


async function getJiraStoryMetaData(storyId) {
    const headers = {
        Authorization: authHeader,
        "Content-Type": "application/json",
    };
    const response = await axios.get(`${jiraBaseUrl}/3/issue/${storyId}`, { headers });
    return response.data.fields.attachment;
}

async function downloadFiles(attachmentID) {
    const downloadPromises = await attachmentID.map(async (id) => {
        const url = `${jiraBaseUrl}/2/attachment/content/${id}`;
        console.log(`url is ${url}`);

        try {
            if (!existsSync(downloadDir)) {
                mkdirSync(downloadDir);
            }
            const response = await axios.get(url, {
                responseType: 'application/json',
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                },
            });
            const statusCode = response.status;
            console.log(`Status code: ${statusCode}`);

            if (statusCode === 200) {
                const contentDisposition = response.headers['content-disposition'];
                const filename = (contentDisposition.match(/filename=(.*)/)[1]).replace(/"/g, '');
                const filePath = `${downloadDir}/${filename.replace(/"/g, '')}`;
                writeFile(filePath, await response.data);
                await overwriteEnviromentVariablesForSwaggerAndConfig(filename);
            } else {
                error(`Error downloading file: ${statusCode}`);
            }
        } catch (err) {
            console.log(`Unexpected error: ${err.message}`);
            process.exit(1);
        }
    });

    try {
        await Promise.all(downloadPromises);
        console.log('All files downloaded successfully.');
    } catch (error) {
        console.error('Error downloading files:', error);
    }

}

async function overwriteEnviromentVariablesForSwaggerAndConfig(filename) {
    if (filename != 'config.json') {
        constants.swaggerPathFile = `${process.env.SWAGGER_OUTPUT_FILE_PATH}\\${filename}`;
    } else {
        constants.configFilePath = `${process.env.SWAGGER_OUTPUT_FILE_PATH}\\${filename}`;
    }
}

async function init(id) {
    try {
        const attachmentData = await getJiraStoryMetaData(id);
        const attachmentID = await attachmentData.map((item) => item.id);
        await downloadFiles(attachmentID);
    }
    catch (error) {
        console.error('Error:', error);
    } finally {
        await initCodeGen();
    }
}

export const handler = async (event) => {
    try {
        await init(event.id);
    } catch (error) {

    }
};

(async () => {
    handler({ id: "10009" })
})();

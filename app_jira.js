import axios from "axios";
import { existsSync, mkdirSync, createWriteStream } from 'fs';

const jiraBaseUrl = "https://shivasai.atlassian.net/rest/api";
const authHeader = 'Basic c2FpbGVlNzYxNjQ3QGdtYWlsLmNvbTpBVEFUVDN4RmZHRjA0ZDhJcGxseDlSb3JfU2JJbmVpOFNhMVYtR0pJNGhSTERLaDlJMDZYTkRaNDROUk9fNkRGXzFKblFVM0tQdDZ3NTNQNEY2Rkd3Z2s0eFhnWXhNSzF5M2hDb1pfbDhkZzIyeTlocUZmaExCcHhMckMzMGlBV2F3YXBIaXBlTEg5OGJaOUdhcTVweDFVZUNlcjIzSTQxNTZVcVFCTU9WemVqNzQwWC1VWG8zX289NjYwNkY2MjQ=';
const downloadDir = 'C:/cypress-output-folder-testing';
async function getJiraStoryMetaData(storyId) {
    const headers = {
        Authorization: authHeader,
        "Content-Type": "application/json",
    };
    const response = await axios.get(`${jiraBaseUrl}/3/issue/${storyId}`, { headers });
    return response.data.fields.attachment;
}


async function readAttachment(attachmentID) {
    const url = `${jiraBaseUrl}/2/attachment/content/${attachmentID}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });

        return response.request.res.responseUrl;
    } catch (error) {
        console.error(error.message);
    }
}

async function downloadAttachments(attachmentUrl) {
    await downloadFile(attachmentUrl)
}

async function downloadFile(url) {
    try {
        if (!existsSync(downloadDir)) {
            mkdirSync(downloadDir);
        }
    } catch (err) {
        console.log(`Error creating download directory: ${err.message}`);
        process.exit(1);
    }

    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });

        const statusCode = response.status;
        console.log(`Status code: ${statusCode}`);

        if (statusCode === 200) {
            const contentDisposition = response.headers['content-disposition'];
            const filename = contentDisposition.match(/filename=(.*)/)[1];
            console.log(`File name: ${filename.replace(/"/g, '')}`);

            const filePath = `${downloadDir}/${filename.replace(/"/g, '')}`;
            const fileStream = createWriteStream(filePath);
            response.data.pipe(fileStream);

            fileStream.on('finish', () => {
                console.log(`File downloaded successfully to ${filePath}`);
            });

            fileStream.on('error', (err) => {
                console.log(`Error writing file: ${err.message}`);
                process.exit(1);
            });
        } else {
            error(`Error downloading file: ${statusCode}`);
        }
    } catch (err) {
        console.log(`Unexpected error: ${err.message}`);
        process.exit(1);
    }
}

const attachmentData = await getJiraStoryMetaData("10009");
const attachmentID = await attachmentData.map((item) => item.id);

console.log(attachmentID);

await attachmentID.forEach(async (id) => {
    const url = `${jiraBaseUrl}/2/attachment/content/${id}`;
    console.log(`url is ${url}`);
    await downloadAttachments(url);
})
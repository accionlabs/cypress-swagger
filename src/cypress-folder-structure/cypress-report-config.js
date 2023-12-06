import { constants } from "../constants.js";
import { writeFile } from "../util.js";

export async function createReportConfig() {
	const reportContent = constants.reportConfig;
	await writeFile("report-config.json", reportContent);
	console.log(`report-config.json created successfully.`);
}

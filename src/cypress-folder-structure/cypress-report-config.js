import { constants } from "../constants.js";
import { writeFile } from "../util.js";

export function createReportConfig() {
	const reportContent = constants.reportConfig;
	writeFile("report-config.json", reportContent);
	console.log(`report-config.json created successfully.`);
}

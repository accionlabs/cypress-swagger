import { openAPISpec } from "../openAPISpec.js";

export function validateServerURL(serverURL) {
	// Regular expression to match valid HTTP or HTTPS URLs
	const httpHttpsRegex = /^(http:\/\/|https:\/\/)[\w.-]+(:\d+)?(\/\S*)?$/;

	if (!httpHttpsRegex.test(serverURL)) {
		console.error(`Invalid server URL: ${serverURL}`);
		process.exit(0);
	}

	console.log(`Server URL is valid: ${serverURL}`);
}

export function checkAndSetServerURLData(serverURL) {
	const serverURLs = openAPISpec.allURLCombinations;

	if (!serverURLs || serverURLs.length === 0) {
		console.error("No server URLs are available.");
		process.exit(0);
	}

	// Iterate through serverURLs
	serverURLs.forEach((URL) => {
		if (URL === serverURL) {
			openAPISpec.baseApiURL = URL;
			console.log("this is base url", openAPISpec.baseApiURL);
			console.log(`Server URL: ${URL}`);
		}
	});

	if (openAPISpec.baseApiURL == "") {
		console.log(
			`Server URL ${serverURL} provided in arugments is not macthing with Server URL's of Swagger object.`
		);
		process.exit(0);
	}
	console.log(`Server URL is valid: ${serverURL}`);
}

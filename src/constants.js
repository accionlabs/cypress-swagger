export const constants = {
	projectPath: "",
	npmPackage: `npm init -y`,
	cypressPackage: `npm install --save cypress config`,
	ajyPackage: `npm install ajv --save`,
	cypressFoldersName: ["downloads", "e2e", "fixtures", "support"],
	cypressParentDirectory: ".",
	fixtureDirPath: "../../fixtures",
    cypressRunAndGenerateReportCommand : { "generate-merge-report" : "npx cypress run --reporter mochawesome \
    --reporter-options reportDir='cypress/results',overwrite=false,html=false,json=true && npx mochawesome-merge 'cypress/results/*.json' > mochawesome.json"},
    cypressRunCommand : "npx cypress run",
    contentTypesSupportsFileUploadAndDownload : [
                                                    "application/octet-stream",
                                                    "application/pdf",
                                                    "application/zip",
                                                    "application/gzip",
                                                    "application/vnd.mycompany.myapp.v2+json",
                                                    "application/vnd.ms-excel",
                                                    "application/vnd.openstreetmap.data+xml",
                                                    "Application/msword",
                                                    "image/png",
                                                    "image/jpeg",
                                                    "image/gif",
                                                    "image/bmp"
                                                ],
	pretteierPackage: "npm install --save-dev --save-exact prettier",
    reportingPackages : "npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator",
	pretterierFormatAllFiles: "npx prettier . --write",
	pretteierConfig: `  { "trailingComma": "es5", 
                            "tabWidth": 4, 
                            "semi": true, 
                            "singleQuote": true 
                        }`,
	cypressFileExtension: ".cy.js",
	cypressEnvSyntaxIncode: `Cypress.env("CYPRESS_BASE_URL")`,
	cypressConfig: ` const { defineConfig } = require("cypress");
                        module.exports = defineConfig({
                        e2e: {
                            setupNodeEvents(on, config) {
                                on("task", {
                                    log(message) {
                                        console.log(message);
                                        return null;
                                    },
                                });
                            },
                            specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx,features}",
                            supportFile: false,
                            screenshotOnRunFailure : false,
                            env : {
                                CYPRESS_BASE_URL : 'CYPRESS_BASE_URL_PLACEHOLDER',
                                fileuploadContentTypes : 'PLACEHOLDER_CONTENT_TYPES'
                            }
                        },
                    }) `,
	reportConfig: `{
                        "reporterEnabled": "mochawesome",
                        "mochawesomeReporterOptions": {
                            "reportDir": "cypress/reports",
                            "reportFilename": "report",
                            "overwrite": false,
                            "html": true,
                            "json": true,
                            "charts": true,
                            "video": false 
                        }
                    }`,
	customCommands: `// ***********************************************
                        // This example commands.js shows you how to
                        // create various custom commands and overwrite
                        // existing commands.
                        //
                        // For more comprehensive examples of custom
                        // commands please read more here:
                        // https://on.cypress.io/custom-commands
                        // ***********************************************
                        //
                        //
                        // -- This is a parent command --
                        // Cypress.Commands.add('login', (email, password) => { ... })
                        //
                        //
                        // -- This is a child command --
                        // Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
                        //
                        //
                        // -- This is a dual command --
                        // Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
                        //
                        //
                        // -- This will overwrite an existing command --
                        // Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
                        `,
	globalConfig: `// ***********************************************************
                    // This example support/e2e.js is processed and
                    // loaded automatically before your test files.
                    //
                    // This is a great place to put global configuration and
                    // behavior that modifies Cypress.
                    //
                    // You can change the location of this file or turn off
                    // automatically serving support files with the
                    // 'supportFile' configuration option.
                    //
                    // You can read more here:
                    // https://on.cypress.io/configuration
                    // ***********************************************************

                    // Import commands.js using ES2015 syntax:
                    import './commands'

                    // Alternatively you can use CommonJS syntax:
                    // require('./commands')`,
};

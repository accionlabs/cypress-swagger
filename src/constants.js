import dotenv from 'dotenv';
// Load environment variables from .env file
const environment = process.env.ENV || "development";

dotenv.config({
    path: `./.env.${environment}`
});

export const constants = {
    projectPath: process.env.SWAGGER_OUTPUT_FILE_PATH,
    repoNameForOutputGeneration: "",
    fullPathOfSwaggerGitProject: `${process.env.SWAGGER_OUTPUT_FILE_PATH}//${process.env.REPO_NAME}`,
    commitMessageToPushInRepo: process.env.COMMIT_MESSAGE_TO_PUSHINREPO,
    repoOwner: process.env.REPO_OWNER,
    repoName: process.env.REPO_NAME,
    repoUrlInWhichOutputTobePushed: process.env.REPO_URL_IN_WHICH_OUTPUT_TO_BE_PUSHED,
    branchName: process.env.BRANCH_NAME,
    masterBranchName: process.env.MASTER_BRANCH_NAME,
    swaggerPathFile: process.env.SWAGGERFILE_PATH,
    operation: process.env.OPERATION,
    serverUrl: process.env.SERVER_URL,
    npmPackage: `npm init -y`,
    updateInfo: [],
    cypressPackage: `npm install --save cypress config`,
    ajyPackage: `npm install ajv --save`,
    cypressFoldersName: ["downloads", "e2e", "fixtures", "support"],
    cypressParentDirectory: ".",
    fixtureDirPath: "../../fixtures",
    cypressRunAndGenerateReportCommand: {
        "test": "npm install && npx cypress run --reporter mochawesome --reporter-options reportDir=results,overwrite=false,html=false,json=true",
        "generate-report": "npx mochawesome-merge 'results/*.json' > mochawesome.json",
        "merge-report": "npx marge mochawesome.json"
    },
    cypressRunCommand: "npx cypress run",
    contentTypesSupportsFileUploadAndDownload: [
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
    reportingPackages: "npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator",
    pretterierFormatAllFiles: "npx prettier . --write",
    pretteierConfig: ` { 
                            "trailingComma": "es5", 
                            "tabWidth": 4, 
                            "semi": true, 
                            "singleQuote": true 
                        }`,
    cypressFileExtension: ".cy.js",
    cypressEnvSyntaxIncode: `Cypress.env("CYPRESS_BASE_URL")`,
    cypressConfig: `import { defineConfig } from 'cypress';
                    export default defineConfig({
                        e2e: {
                            setupNodeEvents(on, config) {
                                on('task', {
                                    log(message) {
                                        console.log(message);
                                        return null;
                                    },
                                });
                            },
                            specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx,features}',
                            supportFile: false,
                            screenshotOnRunFailure: false,
                            env: {
                                CYPRESS_BASE_URL: 'CYPRESS_BASE_URL_PLACEHOLDER',
                                fileuploadContentTypes: 'PLACEHOLDER_CONTENT_TYPES',
                            },
                        },
                    });`,
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
    dockerFileConfig: `
    FROM alpine as clone

    WORKDIR /app

    RUN apk update && apk add --no-cache git
    RUN git clone https://github.com/ShivasaiMandepally/cypress-codgen.git .

    FROM cypress/base:latest
    WORKDIR /app

    # Copy files from the previous stage (e.g., build artifacts)
    COPY --from=clone /app /app
    RUN npm install

    # This has to be replaced with CMD ["npm", "run", "test"] once the source code is changed.
    CMD ["npx", "cypress", "run"]`,
    dockerGitignoreConfig: `
    node_modules
    Dockerfile
    .gitignore
    reports
    README.md`,

};

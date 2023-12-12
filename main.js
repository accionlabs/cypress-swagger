import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config({
    path: "./env"
});
import { initiateSwaggerToCypress } from "./src/set-data-and-validation/setDataAndValidate.js";
// let args = process.argv.splice(2);

export async function init() {
    await initiateSwaggerToCypress();
}

if (process.env.PRODUCTION == "false") {
    init();
}

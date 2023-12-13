import dotenv from 'dotenv';
import { initiateSwaggerToCypress } from "./src/set-data-and-validation/setDataAndValidate.js";
const environment = process.env.ENV || "development";

dotenv.config({
    path: `./env.${environment}`
});

export async function initCodeGen() {
    await initiateSwaggerToCypress();
}


import { initiateSwaggerToCypress } from "./set-data-and-validation/setDataAndValidate.js";
let args = process.argv.splice(2);
await initiateSwaggerToCypress(args);

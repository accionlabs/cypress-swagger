# cypress-swagger

# npm install

# npm run start <Config JSON file path>

```
Config JSON file format to CREATE new output for the given Swagger file.


{
  "swaggerPathFile": "<path of Swagger file>",
  "swaggerOutputFilePath": "<path of output folder(output folder name should not be already existed)>",
  "serverUrl": "<Server URL>", 
  "operation": "CREATE" // It represents new output folder creation.
}

Config JSON format to UPDATE new output for the given Swagger file.

{
  "swaggerPathFile": "<path of updated Swagger file>",
  "swaggerOutputFilePath": "<path of output folder(already existed output folder name)>",
  "serverUrl": "<Server URL>",
  "operation": "UPDATE", // It represents update in existing output folder.
  "updateInfo": [
    {
      "tags": [<Name of the tag in the swagger file which is modified>],
      "methods": [<Method names seprated by comma>],
      "apiEndPoint": [<API endpoint>],
      "operation": <operation name> // "UPDATE", "DELETE", "DEPRECATED", "CREATE" 
    }
  ]
}

examples

CREATE

{
  "swaggerPathFile": "C:\\Swagger Test File\\swagger-20231108T103321Z-001\\swagger\\swaggerWithExamplesV2.json",
  "swaggerOutputFilePath": "C:\\Swagger-outputs\\output96",
  "serverUrl": "https://petstore.swagger.io/v2",
  "operation": "CREATE"
}

UPDATE

{
  "swaggerPathFile": "C:\\Swagger Test File\\swagger-20231108T103321Z-001\\swagger\\UPDATE_DEL_DEP_.json",
  "swaggerOutputFilePath": "C:\\Swagger-outputs\\output96",
  "serverUrl": "https://petstore.swagger.io/v2",
  "operation": "UPDATE",
  "updateInfo": [
    {
      "tags": [
        "pets"
      ],
      "methods": [
        "put"
      ],
      "apiEndPoint": "/pet/{petId}/uploadImage",
      "operation": "UPDATE"
    },
    {
      "tags": [
        "pets"
      ],
      "methods": [
        "put"
      ],
      "apiEndPoint": "/pet/{petId}",
      "operationId": "getPetById",
      "operation": "UPDATE"
    },
    {
      "tags": [
        "store"
      ],
      "methods": [
        "delete"
      ],
      "apiEndPoint": "/store/order/{orderId}",
      "operationId": "deleteOrder",
      "operation": "DELETE"
    },
    {
      "tags": [
        "store"
      ],
      "methods": [
        "get"
      ],
      "apiEndPoint": "/store/inventory",
      "operationId": "getInventory",
      "operation": "DEPRECATED"
    }
  ]
}


```
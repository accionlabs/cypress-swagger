import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";


export const getSecrets = async (secretName, awsRegion) => {
    const client = new SecretsManagerClient({
        region: awsRegion,
    });

    try {
        const response = await client.send(
            new GetSecretValueCommand({
                SecretId: secretName,
                VersionStage: "AWSCURRENT",
            })
        );

        return JSON.parse(response.SecretString);
    } catch (error) {
        throw error;
    }
};
import { isUndefined } from "lodash";

export function ensurePrefixedEnvironment(environmentPrefix: string, allowUnprefixed: boolean = true, collectOnly: boolean = true) {
    return function getEnv(id: string): any {

        // console.log(environmentPrefix, id, process.env[id], process.env[`${environmentPrefix}_${id}`]);

        if (isUndefined(process.env[id]) === false
            && isUndefined(process.env[`${environmentPrefix}_${id}`]) === false) {

            collectToBeDeletedEnvironmentVariable(id, process.env[id]);

            if (collectOnly === false) {
                console.warn(`${environmentPrefix}: Environment variable ${id}=${process.env[id]} is deprecated.`);
                console.warn(`-- Migration to ${environmentPrefix}_${id}=${process.env[id]} encountered, however ${id} is still set, this will likely lead to problems!`);
            }

            throw new Error(`Duplicate environment variables encountered. You cannot both set ${id} (deprecated) and ${environmentPrefix}_${id}`);
        }

        if (isUndefined(process.env[id]) === false && isUndefined(process.env[`${environmentPrefix}_${id}`]) === true) {

            collectUnprefixedEnvironmentVariable(environmentPrefix, id, process.env[id]);
            collectToBeDeletedEnvironmentVariable(id, process.env[id]);

            if (collectOnly === false && allowUnprefixed === false) {
                console.warn(`${environmentPrefix}: Environment variable ${id}=${process.env[id]} is deprecated.`);
                console.warn(`-- Please migrate to ${environmentPrefix}_${id}=${process.env[id]}`);
            }

            if (allowUnprefixed === false) {
                throw new Error(`ensurePrefixedEnvironment allowUnprefixed is disallowed for setting ${environmentPrefix}_${id}`);
            }

            return process.env[id];
        }

        return process.env[`${environmentPrefix}_${id}`];
    };
}

const collectedUnprefixedEnvVariableCollection: string[] = [];
const toBeDeletedEnvVariables: string[] = [];

function collectUnprefixedEnvironmentVariable(environmentPrefix: string, id: string, value: any): void {
    collectedUnprefixedEnvVariableCollection.push(`${environmentPrefix}_${id}=${process.env[id]}`);
}

function collectToBeDeletedEnvironmentVariable(id: string, value: any): void {
    toBeDeletedEnvVariables.push(`${id}=${process.env[id]}`);
}


export function getEnvironmentVariableErrors(): { isError: boolean, result: string } {
    let result = "";

    if (toBeDeletedEnvVariables.length > 0) {
        result += `\n\n=== Deprecated environment variables were found.\n=== Delete the following entries:\n\n`;
        result += toBeDeletedEnvVariables.join("\n");
    }

    if (collectedUnprefixedEnvVariableCollection.length > 0) {
        result += `\n\n=== Please migrate to the following environment variables:\n\n`;
        result += collectedUnprefixedEnvVariableCollection.join("\n");
    }

    return {
        result,
        isError: result.length > 0
    };
}

export function logEnvironmentVariableErrors(): void {
    const res = getEnvironmentVariableErrors();
    if (res.isError === true) {
        console.warn(res.result);
    }
}

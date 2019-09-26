import { CLI, defineCLIEnvironment } from "@aaa-backend-stack/build-tools";
import * as _ from "lodash";
import * as hashing from "./hashing";

const pkg = require("../package.json");

export function injectCLI(defaultHashingProvider: hashing.IHashingDefinition) {

    return defineCLIEnvironment({
        name: `${pkg.name} CLI`,
        version: pkg.version,
        commands: {
            defaultHashingProvider: getHashingFunction(defaultHashingProvider),
            ...(<object>_.reduce([
                hashing.pbkdf2Early2015,
                hashing.pbkdf2Late2016
            ], (sum, item) => {
                return {
                    ...sum,
                    [item.SPEC.id]: getHashingFunction(item)
                };
            }, {}))
        },
        args: {
            password: ["p", "the password to generate the hash and salt for", "string", "your-password-to-hash"],
        }
    });

}

function getHashingFunction(hashingProvider: hashing.IHashingDefinition) {

    return async ({ password }) => {

        CLI.info(`Generating hash and salt for "${password}" using ${hashingProvider.SPEC.id}`);

        CLI.info("Salt:");
        const salt = await hashingProvider.createSalt();
        CLI.info(salt);

        CLI.info("Hash:");
        const hash = await hashingProvider.hashPassword(password, salt);
        CLI.info(hash);

    };
}


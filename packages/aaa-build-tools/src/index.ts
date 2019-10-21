// This package encapsulates and owns build only dependencies and checks if a expected and supported node version (LTS) is used throughout the service.
const pkg = require("../package.json");

import * as semver from "semver";
import * as _ from "lodash";
export const SUPPORTED_NODE_VERSIONS = "~8 || ~10 || ~12";

if (semver.satisfies(process.version, SUPPORTED_NODE_VERSIONS) === false) {
    console.error(`@aaa-backend-stack/build-tools: Encountered node version "${process.version}", this stack only supports node in version range "${SUPPORTED_NODE_VERSIONS}"`);
}

import * as cliNamespace from "cli";
export { cliNamespace as CLI };

import * as fsExtraNamespace from "fs-extra";
export { fsExtraNamespace as FS_EXTRA };

export { semver as SEMVER };

export const REQUIRE_DIR: (absolutePathToDirectory: string, options?: Partial<{
    recurse: boolean;
    camelcase: boolean;
    duplicates: boolean;
}>) => object = require("require-dir");

export { defineCLIEnvironment, ICLIEnvironmentOptions } from "./defineCLIEnvironment";

import * as dotenv from "dotenv";

export function setupDefaultEnv(absolutePathToEnvFile: string) {

    const result = dotenv.config({
        path: absolutePathToEnvFile
    });

    // finally check env variables, no __MUST_BE_DEFINED_EXPLICITLY__ value is allowed to still exist there!
    _.forOwn(<object>process.env, (value, key) => {
        if (value === "__MUST_BE_DEFINED_EXPLICITLY__") {
            throw new Error(`process.env variable ${key} is set to ${value} (check your .env configuration)`);
        }
    });

    // log node version and build-tools settings
    if (!process.env.HIDE_AAA_BUILD_TOOLS_INFO) {
        console.log(`Running in node@${process.version} (NODE_ENV=${process.env.NODE_ENV} @aaa-backend-stack/build-tools@v${pkg.version}).`);
    }

}

export {
    ILazySingletonInitializer,
    ILazyConfig,
    IReconfigurableSingletonInitializer
} from "./ILazyInitializers";

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/cli",
    "@types/dotenv",
    "@types/node",
    "@types/fs-extra",
    "@types/semver",
    "cli",
    "dotenv",
    "fs-extra",
    "rimraf",
    "require-dir",
    "npm-watch",
    "nodemon",
    "semver",
    "sort-package-json"
];

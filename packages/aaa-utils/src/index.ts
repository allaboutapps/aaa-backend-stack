export { getUniqueCollection } from "./getUniqueCollection";
export { isUID } from "./isUID";
export {
    ensurePrefixedEnvironment, getEnvironmentVariableErrors, logEnvironmentVariableErrors
} from "./ensurePrefixedEnvironment";
export {
    attachGlobalUncaughtExceptionHandler
} from "./attachGlobalUncaughtExceptionHandler";

export { execAsync } from "./execAsync";

import * as hashing from "./hashing";
export { hashing };

import * as zxcvbnNamespace from "zxcvbn";
export { zxcvbnNamespace as ZXCVBN };

import * as traverseNamespace from "traverse";
export { traverseNamespace as TRAVERSE };

import * as bluebirdRetryNamespace from "bluebird-retry";
export { bluebirdRetryNamespace as BLUEBIRD_RETRY };

import * as tempWriteNamespace from "temp-write";
export { tempWriteNamespace as TEMP_WRITE };

export { synchronized, synchronizedBy } from "./synchronized";

export function __TESTS__() {
    require("./tests");
}

export { injectCLI } from "./cli";

export { HookLifeCycle, IGenericHook, IGenericHookConstructor, IHookLifeCycleOptions, IHookMap } from "./HookLifeCycle";

import * as globNamespace from "glob";
export { globNamespace as GLOB };
export const GLOB_PROMISE: (pattern: string, options?: globNamespace.IOptions) => Promise<string[]> = Promise.promisify(globNamespace);
export { checkFSTmpWriteable } from "./checkFSTmpWriteable";

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/temp-write",
    "@types/traverse",
    "@types/glob",
    "glob",
    "temp-write",
    "traverse",
    "zxcvbn"
];   

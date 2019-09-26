export { getHapiLoggerPlugin } from "./getHapiLoggerPlugin";
export { ILogger, ILazyInitializedLogger, getChildLogger } from "./logger";
export { IFatalErrorsEmailConfig, IInitializeConfig, ILoggingConfig } from "./IInitializeConfig";
export { Transporter } from "nodemailer";

import logger from "./logger";
export default logger;

import * as bunyanNamespace from "bunyan"; // tsd definitions get loaded.
export { bunyanNamespace as BUNYAN };

// export function __TESTS__() {
//     require("./tests");
// }

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/bunyan",
    "bunyan",
    "good"
];

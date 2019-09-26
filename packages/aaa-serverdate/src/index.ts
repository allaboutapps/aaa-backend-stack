export * from "./serverdate";
export { config, IConfig } from "./config";

// export function __TESTS__() {
//     require("./tests");
// }

// export the Moment 3rd party deps...
import * as MomentNamespace from "moment";
export { MomentNamespace as MOMENT };

import * as MomentTimezoneNamespace from "moment-timezone";
export { MomentTimezoneNamespace as MOMENT_TIMEZONE };

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/moment-timezone",
    "moment",
    "moment-timezone",
];

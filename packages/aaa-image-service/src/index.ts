import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/image-service");

const commandExistsSync = require("command-exists").sync;
if (!commandExistsSync("gm")) {
    throw new Error("GraphicsMagick is not installed, ImageService cannot execute");
}

import * as gm from "gm";

export { gm as GM };

export * from "./_errors";
export * from "./_types";

import { instance } from "./image";
export default instance;

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/gm",
    "gm"
];

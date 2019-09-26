import * as path from "path";

import { SERVER } from "@aaa-backend-stack/rest";
export { IApiOptions } from "@aaa-backend-stack/rest";

export const rest: SERVER.IApiOptions = {
    absolutePathToHooksDirectory: path.resolve(__dirname, "../hooks"),
    cors: true,
    host: process.env.SERVER_HOST || "0.0.0.0",
    port: process.env.SERVER_PORT || "8000",
    enableHapiDebugLogs: process.env.HAPI_DEBUG_LOG === "true",
    baseHooks: {
        inertStaticHandlers: {
            enabled: true
        },
        visionHandlebarsTemplates: {
            enabled: true,
            absolutePathToTemplates: path.join(__dirname, "../../templates")
        },
        requestCLSContext: {
            enabled: true
        }
    }
};

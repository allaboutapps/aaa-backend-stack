import { pushTestIOS } from "./pushTestIOS";
import { pushTestAndroid } from "./pushTestAndroid";
import { CLI, defineCLIEnvironment } from "@aaa-backend-stack/build-tools";
import * as _ from "lodash";
import { apnProvider } from "./apnProvider";

const pkg = require("../package.json");

export interface IInjectPushCLIparsedArgs {
}

export function injectCLI() {

    return defineCLIEnvironment({
        name: `${pkg.name} CLI`,
        version: pkg.version,
        commands: {
            "ios": async (parsedArgs) => {
                await pushTestIOS({
                    clientToken: parsedArgs.clientToken,
                    appBundleId: apnProvider.CONFIG.ios.jwt.appBundleId,
                    teamId: apnProvider.CONFIG.ios.jwt.teamId,
                    keyFile: apnProvider.CONFIG.ios.jwt.keyFile,
                    keyId: apnProvider.CONFIG.ios.jwt.keyId,
                    production: parsedArgs.production ? true : false
                }, parsedArgs.message);
            },
            "android": async (parsedArgs) => {
                await pushTestAndroid({
                    apiKey: parsedArgs.androidApiKey,
                    token: parsedArgs.clientToken,
                    url: parsedArgs.androidEndpoint
                }, parsedArgs.message);
            },
        },
        args: {
            clientToken: ["t", "push token (also called clientToken) to push the message to", "string", "e6b4e138-371b-48ca-ba85-991fbacf6d22"], // default root UserUid
            message: ["m", "message to send", "string", "\uD83D\uDCE7 \u2709 You have a new message"],
            production: ["p", "(ios only) if flag is present execute production push", "boolean"],
            androidApiKey: ["gcm-key", "(android only) google cloud messaging api key", "string", apnProvider.CONFIG.android.apiKey],
            androidEndpoint: ["gcm-endpoint", "(android only) google cloud messaging endpoint", "string", apnProvider.CONFIG.android.url]
        }
    });

}


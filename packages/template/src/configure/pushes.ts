import * as path from "path";

import { apnProvider, IPushConfig } from "@aaa-backend-stack/pushes";
import { ensurePrefixedEnvironment } from "@aaa-backend-stack/utils";
export { IPushConfig } from "@aaa-backend-stack/pushes";

const ENV_AAA_PUSHES = ensurePrefixedEnvironment("AAA_PUSHES");

export const pushes: IPushConfig = apnProvider.configure({
    android: {
        send: ENV_AAA_PUSHES("PUSH_ANDROID_SEND") === "true",
        apiKey: ENV_AAA_PUSHES("PUSH_ANDROID_APIKEY"),
        url: ENV_AAA_PUSHES("PUSH_ANDROID_URL"),
        backOff: 1000,
        retryCount: 3
    },
    ios: {
        send: ENV_AAA_PUSHES("PUSH_IOS_SEND") === "true",
        jwt: {
            keyFile: path.resolve(__dirname, "../../", ENV_AAA_PUSHES("PUSH_IOS_JWT_KEY_FILENAME")),
            keyId: ENV_AAA_PUSHES("PUSH_IOS_JWT_KEY_ID"),
            teamId: ENV_AAA_PUSHES("PUSH_IOS_JWT_TEAM_ID"),
            appBundleId: ENV_AAA_PUSHES("IOS_APP_BUNDLE_ID")
        },
        production: ENV_AAA_PUSHES("PUSH_IOS_PRODUCTION") === "true",
        retryCount: 3
    }
});

/*
 * Vital: must be injected in every entry node process entry point
 * These are the first imports for your whole application
 * none of the aaa packages are yet statically configured
 *
 * ---
 * DO NOT ADD YOUR OWN IMPORTS BETWEEN THESE LINES UNLESS YOU KNOW WHAT YOU ARE DOING...
 * ---
 */
import { setupDefaultEnv } from "@aaa-backend-stack/build-tools"; // ensure node version
// tslint:disable-next-line:no-import-side-effect
import "@aaa-backend-stack/polyfills";

import * as path from "path";

// load the default env config, any environment variables not already provided will get automatically set.
setupDefaultEnv(path.join(__dirname, "../../env/common.env"));

import { getUtcOffset } from "@aaa-backend-stack/serverdate";
import { ensurePrefixedEnvironment, hashing, logEnvironmentVariableErrors } from "@aaa-backend-stack/utils";

import { validatePackageOwnership } from "./_validate";

// all our own packages that need static global configuration/initialization prior to their usage...
import { gitInfo } from "./gitInfo";
import { logger, loggerInstance } from "./logger";
import { pushes } from "./pushes";
import { rest } from "./rest";
import { serverdate } from "./serverdate";
import { storage } from "./storage";

/*
 * aaa packages are now statically configured
 *
 * ---
 * FEEL FREE TO ADD YOUR IMPORTS BELOW THESE LINES...
 * ---
 */

if (!process.env.NODE_ENV) {
    // tslint:disable-next-line:no-console
    console.error("Error: No NODE_ENV set! EXITING...");
    process.exit(1);
}

// tslint:disable-next-line:no-require-imports no-var-requires
const PKG = require("../../package.json");

const ENV_HOOKS = ensurePrefixedEnvironment("HOOKS");
const ENV_MAILER = ensurePrefixedEnvironment("MAILER");

export const CONFIG = {

    // GLOBAL STATIC PACKAGE CONFIGURATION (@aaa-backend-stack/* packages)
    logger,
    pushes,
    serverdate,
    gitInfo,
    rest,
    storage: storage(getUtcOffset()),

    // GENERAL env config
    env: process.env.NODE_ENV,
    pkg: PKG,

    // HOOK enabled bindings
    enabledHooks: {
        devtools: ENV_HOOKS("ENABLE_WEBSOCKET_DEV_TOOLS") === "true",
        swagger: ENV_HOOKS("ENABLE_SWAGGER") === "true"
    },

    // SERVICE SPECIFIC OR INITIALIZATION BINDING CONFIGURATION
    // (e.g.used in hooks or simply as custom constants anywhere in this service)

    // set the hashing function (password hashing + salts) which should be used in the whole project
    hashing: hashing.pbkdf2Late2016,

    email: {
        sendEmails: !(process.env.EMAIL_SEND === "false"),
        defaultSender: ENV_MAILER("EMAIL_SENDER_DEFAULT")
    },

    routes: {
        monitoringAdminSecret: process.env.ADMIN_SECRET,
        assetsUrlHostExternal: process.env.EXTERNAL_ASSETS_URL_HOST,
        publicApiUrl: process.env.PUBLIC_API_URL
    },

    auth: {
        passwordStrengthMinimumScore: parseInt(process.env.PASSWORD_STRENGTH_MINIMUM_SCORE, 10),
        tokenValidity: parseInt(process.env.TOKEN_VALIDITY, 10) || 86400000,
        passwordResetTokenValidity: parseInt(process.env.PASSWORD_RESET_TOKEN_VALIDITY, 10) || 900,
        passwordResetEndpoint: "/api/v1/auth/forgot-password/",
        allowGuestAuth: process.env.ALLOW_GUEST_AUTH === "true",
        // tslint:disable-next-line:strict-boolean-expressions
        refreshTokenValidityMS: parseInt(process.env.REFRESH_TOKEN_VALIDITY, 10) || 0, // default 0 = unlimited
        scope: {
            userScopeIdentifier: "user",
            guestScopeIdentifier: "guest"
        },
        google: {
            enabled: process.env.AUTH_GOOGLE_ENABLED === "true",
            clientId: process.env.AUTH_GOOGLE_CLIENT_ID
        },
        facebook: {
            enabled: process.env.AUTH_FACEBOOK_ENABLED === "true",
            appId: process.env.AUTH_FACEBOOK_APP_ID,
            appSecret: process.env.AUTH_FACEBOOK_APP_SECRET
        },
        timingAttack: {
            min: 50,
            max: 300
        }
    }

};

// final validation steps and first logs through the loggerInstance

loggerInstance.info({
    env: CONFIG.env
}, "Configure evaluated");

if (CONFIG.env !== "production") {
    // debugging only, it's only save to log the above configuration when not in production and trace severity is applied...
    loggerInstance.trace({
        CONFIG
    }, "configure: CONFIG");
}

// validate ownership of packages was not violated by this service package.json file...
// breaking the ownership concept will result in a hard service failure
validatePackageOwnership(PKG);
logEnvironmentVariableErrors();

export default CONFIG;

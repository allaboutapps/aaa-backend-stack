import * as _ from "lodash";
import * as path from "path";

import loggerInitializer from "@aaa-backend-stack/logger";
import { ensurePrefixedEnvironment } from "@aaa-backend-stack/utils";
export { IFatalErrorsEmailConfig, ILoggingConfig } from "@aaa-backend-stack/logger";

// migration helper: support old environment variable keys, however mark unprefixed env variables as deprecated through this helper!
const ENV_AAA_LOGGER = ensurePrefixedEnvironment("AAA_LOGGER");

export const logger = loggerInitializer.configure({
    console: ENV_AAA_LOGGER("LOG_CONSOLE") === "true",
    consoleSeverity: process.env.LOG_LVL || "debug",
    file: ENV_AAA_LOGGER("LOG_FILE") === "false" ? null : path.resolve(__dirname, "../../", ENV_AAA_LOGGER("LOG_FILE")),
    fileSeverity: ENV_AAA_LOGGER("LOG_FILE_MIN_SEVERITY_LEVEL") || "fatal",
    includeRequestPayload: ENV_AAA_LOGGER("LOG_INCLUDE_REQUEST_PAYLOAD") === "true",
    includeRequestHeaders: ENV_AAA_LOGGER("LOG_INCLUDE_REQUEST_HEADERS") === "true",
    includeResponsePayload: ENV_AAA_LOGGER("LOG_INCLUDE_RESPONSE_PAYLOAD") === "true",
    opsIntervalMs: parseInt(ENV_AAA_LOGGER("LOG_OPS_INTERVAL_MS"), 10) || 900000,
    bunyanLoggerName: ENV_AAA_LOGGER("LOGGER_NAME") || "service",
    fileRotationEnabled: ENV_AAA_LOGGER("LOG_FILE_ROTATION_ENABLED") === "true",
    rotationOptions: {
        period: ENV_AAA_LOGGER("LOG_FILE_ROTATION_PERIOD") || "1d",
        count: parseInt(ENV_AAA_LOGGER("LOG_FILE_ROTATION_COUNT"), 10) || 7
    },
    sendEmails: !(ENV_AAA_LOGGER("EMAIL_SEND") === "false"),
    defaultSender: ENV_AAA_LOGGER("EMAIL_SENDER_DEFAULT"),
    errorReceivers: ENV_AAA_LOGGER("EMAIL_RECEIVER_ERRORS"),
    ringBuffer: {
        enabled: ENV_AAA_LOGGER("RING_BUFFER_ENABLED") !== "false",
        maxEntries: parseInt(ENV_AAA_LOGGER("RING_BUFFER_MAX_ENTRIES"), 10) || 50,
        severity: ENV_AAA_LOGGER("RING_BUFFER_SEVERITY_LEVEL") || "trace"
    },
    // This fn is executed for EACH log that will be generated
    // You may return an object with values to be expanded into your log object
    // (in a name collition the log args have precedence)
    injectDefaultLogParameters: function (args): object {

        // rest and storage layer are not initialized yet, therefore we don't load these deps statically at the top
        // tslint:disable-next-line
        const { REQUEST_CONTEXT } = require("@aaa-backend-stack/rest");
        // tslint:disable-next-line
        const { TRANSACTION_CONTEXT } = require("@aaa-backend-stack/storage");

        const request = REQUEST_CONTEXT.getRequest();
        const transaction = TRANSACTION_CONTEXT.getTransaction();
        const res: object | any = {};

        const requestId = _.get(request, "id", null);
        const requestUserUid = _.get(request, "auth.credentials.user.uid", null);
        const transactionId = _.get(transaction, "id", null);

        if (requestId) {
            res.CTX_REQ_ID = requestId;
        }

        if (requestUserUid) {
            res.CTX_REQ_USER = requestUserUid;
        }

        if (transactionId) {
            res.CTX_TX_ID = transactionId;
        }

        return res;
    }
});

export const loggerInstance = loggerInitializer;

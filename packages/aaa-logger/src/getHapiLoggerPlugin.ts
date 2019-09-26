import logger from "./logger";

export function getHapiLoggerPlugin() {
    return {
        register: require("good"), // to monitor our hapi process, we plug in good and pipe the events to our bunyan logger who decides what to do with the information...
        options: {
            requestPayload: logger.CONFIG.includeRequestPayload,
            requestHeaders: logger.CONFIG.includeRequestHeaders,
            responsePayload: logger.CONFIG.includeResponsePayload,
            opsInterval: logger.CONFIG.opsIntervalMs,
            reporters: [
                {
                    reporter: require("./GoodBunyanReporter"), // custom good reporter interface
                    events: {
                        "log": "*",
                        "request": "*",
                        "response": "*",
                        "ops": "*",
                        "error": "*",
                        "request-internal": "*" // http://hapijs.com/api#internal-events
                    }, // any events, bunyan should decide what to do with it.
                    config: {}
                }
            ],
            extensions: ["request-internal"] // https://github.com/hapijs/good/issues/323
        }
    };
}

import { ILazySingletonInitializer } from "@aaa-backend-stack/build-tools";
import * as _ from "lodash";
import * as bunyan from "bunyan"; // tsd definitions get loaded.
import { FS_EXTRA } from "@aaa-backend-stack/build-tools";

import { IInitializeConfig } from "./IInitializeConfig";
import BunyanErrorMailStream from "./BunyanErrorMailStream";
import BunyanSlackStream from "./BunyanSlackStream";

export type BunyanLogger = bunyan.Logger;

export interface ILogger extends BunyanLogger {
    getLastRecords: () => any[];
    getStringifiedLastRecords: () => string;
    _internalBunyanLogger: BunyanLogger;
    _STREAMS: {
        MAIN_LOGGER_STREAMS: bunyan.Stream[];
        CHILD_LOGGER_STREAMS: bunyan.Stream[];
    };
}

// the initializer function for the logger must be called prior to using it.
export type ILazyInitializedLogger = ILogger & ILazySingletonInitializer<IInitializeConfig>;

const logger: Partial<ILazyInitializedLogger> = {
    configure: (config: IInitializeConfig) => {

        if (logger.CONFIG) {
            console.warn("@aaa-backend-stack/logger was already configured, returning previous config");
            return logger.CONFIG;
        }

        logger.CONFIG = config;

        const MAIN_LOGGER_STREAMS = [];
        const CHILD_LOGGER_STREAMS = [];

        if (_.isString(config.file) && config.file.length > 0) {

            // ensure that the bunyan log file exists...
            FS_EXTRA.ensureFileSync(config.file);

            // childLogger must receive a non rotating file logger stream!

            const fileStream = {
                path: config.file,
                level: config.fileSeverity,
            };

            MAIN_LOGGER_STREAMS.push({
                ...fileStream,
                // use bunyans file rotation stream?
                // https://github.com/trentm/node-bunyan#stream-type-rotating-file
                ...(config.fileRotationEnabled ? {
                    type: "rotating-file",
                    period: config.rotationOptions.period,
                    count: config.rotationOptions.count
                } : {})
            });

            // push logger without rotating options...
            CHILD_LOGGER_STREAMS.push(fileStream);

        }

        if (config.console) {

            const consoleStream = {
                stream: process.stdout,
                level: config.consoleSeverity
            };

            MAIN_LOGGER_STREAMS.push(consoleStream);
            CHILD_LOGGER_STREAMS.push(consoleStream);

        }

        // additionally always provide a ringbuffer which runs in trace mode and will be used when fatal errors happen to provide the full output.
        // see https://github.com/trentm/node-bunyan#raw--ringbuffer-stream
        // the current ringBuffer logs can be directly accessed from the outside through the 
        let ringBuffer = null;

        if (config.ringBuffer.enabled) {

            ringBuffer = new bunyan.RingBuffer({
                limit: config.ringBuffer.maxEntries
            });

            const ringBufferStream = {
                stream: ringBuffer,
                level: config.ringBuffer.severity
            };

            MAIN_LOGGER_STREAMS.push(ringBufferStream);
            CHILD_LOGGER_STREAMS.push(ringBufferStream);

        }

        // AFTER the previous check: Add the email error stream through our extra mailer class after the normal logging is setupped...
        if (config.sendEmails) {

            // we need to do this inside the logger creator, as we want to provide the email error stream with a method to log warnings through the logger!
            const errorMailStream = {
                stream: new BunyanErrorMailStream((msg: string) => {
                    logger.warn(msg);
                }, ringBuffer, config),
                level: "fatal" // ensure that only fatal errors are relevant to be emailed!
            };

            MAIN_LOGGER_STREAMS.push(errorMailStream);
            CHILD_LOGGER_STREAMS.push(errorMailStream);

        }

        if (config.slack && config.slack.enabled) {
            const slackStream = {
                stream: new BunyanSlackStream((msg: string) => {
                    logger.warn(msg);
                }, config),
                level: _.isEmpty(config.slack.severity) ? "info" : config.slack.severity,
                type: "raw" // Raw logging saves us time due to not having to call JSON.parse for every record
            };

            MAIN_LOGGER_STREAMS.push(slackStream);
            CHILD_LOGGER_STREAMS.push(slackStream);
        }

        if (config.additionalStreams) {
            _.each(config.additionalStreams, (stream) => {
                MAIN_LOGGER_STREAMS.push(stream);
                CHILD_LOGGER_STREAMS.push(stream);
            });
        }

        logger._internalBunyanLogger = bunyan.createLogger({
            name: config.bunyanLoggerName,
            streams: MAIN_LOGGER_STREAMS,
            // explicitly set error serializer, see https://github.com/trentm/node-bunyan#standard-serializers
            serializers: {
                err: bunyan.stdSerializers.err
            }
        });

        if (config.injectDefaultLogParameters) {
            _.extendWith(logger, logger._internalBunyanLogger, getInjectHandlers(logger._internalBunyanLogger, injectLogObject, config.injectDefaultLogParameters));
        } else {
            _.extendWith(logger, logger._internalBunyanLogger, {});
        }

        logger.getStringifiedLastRecords = () => {

            if (config.ringBuffer.enabled === false) {
                return null;
            }

            return JSON.stringify(JSON.parse(ringBuffer.records as any), null, 2);
        };

        logger.getLastRecords = () => {

            if (config.ringBuffer.enabled === false) {
                return [];
            }

            return ringBuffer.records;
        };

        logger._STREAMS = {
            MAIN_LOGGER_STREAMS,
            CHILD_LOGGER_STREAMS
        };

        return config;
    }
};

function getInjectHandlers(bunyanLogger: bunyan.Logger, injectData: (args: any[], data: {}) => any[], getGlobalLogData: (args: any[]) => object) {
    return {
        trace: function (...args) {
            return bunyanLogger.trace.apply(bunyanLogger, injectData(args, getGlobalLogData(args)));
        },
        debug: function (...args) {
            return bunyanLogger.debug.apply(bunyanLogger, injectData(args, getGlobalLogData(args)));
        },
        info: function (...args) {
            return bunyanLogger.info.apply(bunyanLogger, injectData(args, getGlobalLogData(args)));
        },
        warn: function (...args) {
            return bunyanLogger.warn.apply(bunyanLogger, injectData(args, getGlobalLogData(args)));
        },
        error: function (...args) {
            return bunyanLogger.error.apply(bunyanLogger, injectData(args, getGlobalLogData(args)));
        },
        fatal: function (...args) {
            return bunyanLogger.fatal.apply(bunyanLogger, injectData(args, getGlobalLogData(args)));
        },
    };
}

function injectLogObject(args, additionalData?: object): any[] {

    if (args.length === 0) {
        return args; // noop
    }

    const firstArg: string | object = args[0];

    if (args.length === 1) {

        if (_.isString(firstArg)) {

            // console.log("inject 1 string");

            return [{ ...additionalData }, firstArg];
        } else if (_.isObject(firstArg)) {
            // console.log("inject 1 object");

            return [{
                ...additionalData,
                ...firstArg
            }];
        }

        return args;
    }

    if (args.length === 2) {

        if (_.isString(firstArg)) {
            return args; // fail, this is reversed!

        } else if (_.isObject(firstArg)) {

            // console.log("inject 2 object");

            return [{
                ...additionalData,
                ...firstArg
            }, args[1]];
        }
        return args;
    }

    // none of them matched...
    return args;
}

const childLoggers: {
    [name: string]: BunyanLogger
} = {};

const mockLogger = bunyan.createLogger({
    name: "mockLogger"
});

export function getChildLogger(name: string): BunyanLogger {

    if (_.isUndefined(logger.CONFIG)) {
        console.warn(`Cannot call getChildLogger before logger wasn't statically initialized. Returning mockLogger instead. Ensure to call configure() first. name=${name}`);
        return mockLogger;
    }

    if (childLoggers[name]) {
        return childLoggers[name];
    }

    const internalChildLogger = bunyan.createLogger({
        name,
        streams: logger._STREAMS.CHILD_LOGGER_STREAMS,
        // explicitly set error serializer, see https://github.com/trentm/node-bunyan#standard-serializers
        serializers: {
            err: bunyan.stdSerializers.err
        }
    });

    const childLogger: any = {}; // Attention! will be mutated by extendWith

    if (logger.CONFIG.injectDefaultLogParameters) {
        _.extendWith(childLogger, internalChildLogger, getInjectHandlers(internalChildLogger, injectLogObject, logger.CONFIG.injectDefaultLogParameters));
    } else {
        _.extendWith(childLogger, internalChildLogger, {});
    }

    childLoggers[name] = childLogger;

    return childLoggers[name];
}

// needed for logrotation
// if your file-descriptors are not preserved, you need additional event handling
// https://github.com/trentm/node-bunyan#stream-type-rotating-file
function reopenAllFileStreams() {

    // if this is happening during development, resend the SIGUSR2 signal again as we might run inside nodemons envinonment
    // attention, this will actually fully stop the vm!
    if (process.env.NODE_ENV === "development") {
        logger.warn("Encountered SIGUSR2 while running in env 'development', going to kill this process!");
        return process.kill(process.pid, "SIGUSR2");
    }

    console.warn("@aaa-backend-stack/logger: SIGUSR2 received! Reopening file streams for main logger");
    logger.reopenFileStreams();
    _.each(_.keys(childLoggers), (childLogger) => {
        console.warn("@aaa-backend-stack/logger: SIGUSR2 received! Reopening file streams for childLogger " + childLogger);
        childLoggers[childLogger].reopenFileStreams();
    });
}

if (process.env.NODE_ENV === "development") {
    process.once("SIGUSR2", reopenAllFileStreams);
} else if (process.env.NODE_ENV === "test") {
    // noop if we are ever in a test environment
} else {
    process.on("SIGUSR2", reopenAllFileStreams);
}

export default logger; // default export the logger instance.

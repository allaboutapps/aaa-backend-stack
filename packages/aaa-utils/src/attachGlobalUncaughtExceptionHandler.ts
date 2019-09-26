import { once } from "lodash";

export const attachGlobalUncaughtExceptionHandler = once((timeoutMS: number = 10000) => {
    // Important, especially in production.
    // We must try to log ANY uncaughtExceptions before exiting out service.
    process.on("uncaughtException", function (error) {
        try {
            // try to use the logger to display the error (dynamic, if its even installed in this project)
            require("@aaa-backend-stack/logger").default.fatal({ err: error }, "FATAL PROCESS ERROR (unhandled synchronous code exception): process.uncaughtException");
        } catch (e) {
            // else log normally

            // tslint:disable-next-line:aaa-no-new-date
            console.error((new Date).toUTCString() + " FATAL PROCESS ERROR (unhandled synchronous code exception): process.uncaughtException:", error.message);
            console.error(error.stack);
            console.error(e);
        }

        // and finally kill the process.
        setTimeout(() => {
            console.error("Killed process after timeout due to process.uncaughtException!");
            // important, exit the process when uncaught exceptions happen after trying to log them! DON"T modify this lines until you know exactly what you are doing!!!
            process.exit(1);
        }, timeoutMS);
    });

    // Log uncaught native promise or bluebird rejections
    // see http://bluebirdjs.com/docs/api/error-management-configuration.html
    process.on("unhandledRejection", (error) => {
        try {
            // try to use the logger to display the error (dynamic, if its even installed in this project)
            require("@aaa-backend-stack/logger").default.fatal({ err: error }, "FATAL PROCESS ERROR (unhandled promise rejection): process.unhandledRejection");
        } catch (e) {
            // else log normally

            // tslint:disable-next-line:aaa-no-new-date
            console.error((new Date).toUTCString() + " FATAL PROCESS ERROR (unhandled promise rejection): process.unhandledRejection:", error.message);
            console.error(error.stack);
            console.error(e);
        }

        // and finally kill the process.
        setTimeout(() => {
            console.error("Killed process after timeout due to process.unhandledRejection!");
            // important, exit the process when uncaught exceptions happen after trying to log them! DON"T modify this lines until you know exactly what you are doing!!!
            process.exit(1);
        }, timeoutMS);
    });
});

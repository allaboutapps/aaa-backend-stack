import * as _ from "lodash";
import logger from "./logger";

// Declare internals
let internals = {
    GoodBunyanReporter: null,
    defaults: {}
};

module.exports = internals.GoodBunyanReporter = function (events, config) {

    if (!(this instanceof internals.GoodBunyanReporter)) {
        return new internals.GoodBunyanReporter(events, config);
    }

    config = config || {};

    this._settings = _.defaults(config, internals.defaults);
};


internals.GoodBunyanReporter.prototype.init = function (stream, emitter, callback) {
    stream.on("data", this._report.bind(this));
    callback();
};


internals.GoodBunyanReporter.prototype._report = function (report) {
    const data = report;
    const eventName = data.event;

    if (eventName === "request-internal") {
        // the most common case, always handle these kind first!
        logger.trace(data, eventName);
    } else if (eventName === "error") {

        // determine if normal error or fatal request error
        const error = data.error ? data.error : new Error("Undefined hapi error");
        const isInternal = error.isBoom && error.isServer;
        const stack = error.stack ? error.stack : "no stack available";

        if (isInternal) {
            logger.fatal({ data, error, stack, isInternal }, eventName);
        } else {
            logger.error({ data, error, stack, isInternal }, eventName);
        }

    } else if (eventName === "ops") {
        logger.info(data, eventName); // use info log for ops
    } else {
        logger.debug(data, eventName);
    }

};

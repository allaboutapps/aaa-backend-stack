import * as _ from "lodash";

const omitDeep = require("omit-deep");
const safeJsonStringify = require("safe-json-stringify");

// clear any sequelize JSONified instances + buffer objects within it (contain config for password and db config!)
export const UNSAFE_RECORD_KEYS = [
    "password",
    "salt",
    "pinHash",
    "sequelize", // db
    "connectionManager", // db
    "_readableState", // buffer
    "_writableState", // buffer
    "_raw", // buffer
];

export const BUNYAN_LEVEL_NAMES = {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal"
};

export const BUNYAN_LEVEL_COLORS = {
    20: "#a5dcff",
    30: "good",
    40: "warning",
    50: "danger",
    60: "#000000"
};

export function getSecureBunyanRecord(rawBunyanRecord: any): any {
    let record;
    if (_.isString(rawBunyanRecord)) {
        record = JSON.parse(rawBunyanRecord);
    } else {
        // We need to ensure we're actually using a copy of the records provided,
        // otherwise data passed to bunyan's logging might be modified!
        record = JSON.parse(safeJsonStringify(rawBunyanRecord));
    }

    const secureRecord = omitDeep(record, UNSAFE_RECORD_KEYS);

    return secureRecord;
}

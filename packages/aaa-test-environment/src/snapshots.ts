import * as _ from "lodash";
import * as traverse from "traverse";
import * as path from "path";

export type ICustomReplacer = (key: string, value: any) => any;

// DATE VALIDATOR - stolen from joi via https://github.com/hapijs/joi/blob/master/lib/types/date/index.js
const ISO_DATE_REGEX = /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/;

export function isISODate(dateIsoString: any) {

    if (_.isString(dateIsoString) === false) {
        return false;
    }

    if (dateIsoString.length < 24) {
        // isoStrings are at least 24 characters long!
        return false;
    }

    // tslint:disable-next-line:aaa-no-new-date
    return ISO_DATE_REGEX.test(dateIsoString) && new Date(dateIsoString).toISOString() === dateIsoString;
}

// UID VALUDATOR - stolen from validator "all" PATTERN via https://github.com/chriso/validator.js/blob/master/src/lib/isUUID.js
const UID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isUID(value: string) {
    return (UID_PATTERN.test(value) === true);
}

export interface IPrepareSnapshotOptions {
    excludeTypeISODate: boolean;
    excludeTypeUID: boolean;
    excludeFieldNameID: boolean;
    convertDateInstanceToISODate: boolean;
}

const DEFAULT_PREPARE_SNAPSHOT_OPTIONS = {
    excludeTypeISODate: true,
    excludeFieldNameID: false,
    excludeTypeUID: false,
    convertDateInstanceToISODate: true
};

export function prepareSnapshot<T>(responseBody: T, options: Partial<IPrepareSnapshotOptions> = DEFAULT_PREPARE_SNAPSHOT_OPTIONS, customReplacer?: ICustomReplacer): T {

    const EXCLUDE_DATE = options.excludeTypeISODate === false ? false : true;
    const newResponseBody: T = _.cloneDeep(responseBody);

    // TODO: needs to be secured of circular references!
    traverse<T>(newResponseBody).forEach(function (value) {

        if (EXCLUDE_DATE
            && _.isString(value)
            && isISODate(value)) {

            return "__ISO_8601_DATE_STRING__";
        }

        if (EXCLUDE_DATE
            && options.convertDateInstanceToISODate !== false
            && value instanceof Date) {
            return "__ISO_8601_DATE_STRING__";
        }

        if (options.excludeTypeUID === true
            && _.isString(value)
            && isUID(value)) {

            return "__UID_STRING__";
        }

        if (options.excludeFieldNameID === true
            && _.isString(value)
            && _.lowerCase(this.key) === "id") {

            return "__ID_STRING__";
        }

        if (_.isUndefined(customReplacer) === false) {
            // if the customReplacer returned a non undefined value, replace it!
            const replacedValue = customReplacer(this.key, value);
            if (_.isUndefined(replacedValue) === false) {
                return replacedValue;
            }
        }

    });

    return newResponseBody;
}

let snapshotBaseDirectory = null;

export function getSnapshotsBaseDirectory() {
    if (snapshotBaseDirectory === null) {
        throw new Error("snapshotBaseDirectory was not set!");
    }
    return snapshotBaseDirectory;
}

export function setSnapshotsBaseDirectory(absolutePathToSnapshotDirectory: string) {

    if (snapshotBaseDirectory !== null) {
        throw new Error("snapshotBaseDirectory was already set!");
    }

    snapshotBaseDirectory = absolutePathToSnapshotDirectory;
}

export function getSnapshotFile(uniqueSnapshotFileIdentifier: string) {
    return path.join(snapshotBaseDirectory, uniqueSnapshotFileIdentifier);
}


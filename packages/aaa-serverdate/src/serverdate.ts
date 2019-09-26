// setup the timezone to use and make all moment object use this by default!
// don't import this library with ES6 imports, as we use the supplied moment-timezone from sequelize directly.
// const moment: moment.MomentStatic = require("moment-timezone");

import * as _ from "lodash";
import * as moment from "moment-timezone";
import { config } from "./config";

const Receptacle = require("receptacle");
const utcOffsetLocalString: string = moment().format("Z"); // internal for info

// offset caching. We will cache the value of the utc offset + properly handle winter and summertime changes!
const offsetCache = new Receptacle({ max: 1 }); // Create a cache with max 1 item. (for the local string and normal offset string)
const UTC_OFFSET_EXPIRES_IN_MS = 1000 * 60 * 10; // every 10minutes the utc offset will be recomputed.
const UTC_OFFSET_KEY = "utcOffset";

export function getUtcOffset(): string {

    const currentOffset = offsetCache.get(UTC_OFFSET_KEY);

    if (currentOffset) {
        return currentOffset; // return the cached value...
    }

    // expired, compute the new offset
    const newOffset = moment.tz(config.timezone).format("Z");

    // renew the cache...
    offsetCache.set(UTC_OFFSET_KEY, newOffset, {
        ttl: UTC_OFFSET_EXPIRES_IN_MS,
        refresh: false
    });

    return newOffset;
}

export function getMoment(momentParam = undefined): moment.Moment {
    // all moments from this function get returned in their proper timezone!
    return moment(momentParam).utcOffset(getUtcOffset());
}

export function getCurrentUnixTimestamp(): Number {
    return moment().utcOffset(getUtcOffset()).utc().valueOf();
}

export function getUnixTimestamp(date: Date): Number {
    return moment(date).utcOffset(getUtcOffset()).utc().valueOf();
}

export function duration(...durationParam): moment.Duration {
    return moment.duration(durationParam as any);
}

export function getLoggableTimeRepresentation(milliseconds: number): string {
    let d, h, m, s;
    s = Math.floor(milliseconds / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;

    return `${d} days, ${_.padStart(String(h), 2, "0")}:${_.padStart(String(m), 2, "0")}:${_.padStart(String(s), 2, "0")}`;
}

// return debug information (logging)
export function getInfo() {

    return {
        setTimezone: config.timezone,
        setUtcOffset: getUtcOffset(),
        setTime: getMoment().toString(),
        localUtcOffset: utcOffsetLocalString,
        localTime: moment().toString()
    };
}


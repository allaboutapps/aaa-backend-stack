import "./typings/timekeeper";
import "./typings/chai-jest-snapshot";
const chai: Chai.ChaiStatic = require("chai");

// Setup chai plugins
chai.use(require("chai-http"));
chai.request.addPromises(Promise);

// add promise support to chai for easier rejection testing
chai.use(require("chai-as-promised"));

// add jest snapshot assertions to chai
chai.use(require("chai-jest-snapshot"));

import * as timekeeperNamespace from "timekeeper";

export {
    timekeeperNamespace as TIMEKEEPER
};

export {
    expect
} from "chai";

export const httpRequest = chai.request;

export type IMochaThisContext = Mocha.IHookCallbackContext;

export type IMochaHookFn = (this: Mocha.IHookCallbackContext, done: MochaDone) => any;

export function globalBefore(fn: IMochaHookFn) {
    before(function () {
        // console.log("before");
        return fn.bind(this)();
    });
}

export function globalBeforeEach(fn: IMochaHookFn) {
    beforeEach(function () {
        // console.log("beforeEach");
        return fn.bind(this)();
    });
}

export function globalAfterEach(fn: IMochaHookFn) {
    afterEach(function () {
        // console.log("afterEach");

        // if the test has failed, write out the path to the test file and the short error message!
        if (this.currentTest.state !== "passed"
            && (this.currentTest as any).file
            && (this.currentTest as any).err
            && (this.currentTest as any).err.message) {

            // instantly print out the test file where the error occurred and the short message of it (no stack)
            console.log("\x1b[31m%s\x1b[0m", `    | ${(this.currentTest as any).err.message}`);
            console.log("\x1b[31m%s\x1b[0m", `    | ${(this.currentTest as any).file}`);
        }

        return fn.bind(this)();
    });
}

export function globalAfter(fn: IMochaHookFn) {
    after(fn);
}

export type IHttpTestRequest = ChaiHttp.Request;
export type IHttpTestResponse = ChaiHttp.Response;

import * as snapshotsNamespace from "./snapshots";

export {
    snapshotsNamespace as snapshots
};

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/chai",
    "@types/chai-as-promised",
    "@types/chai-http",
    "@types/mocha",
    "chai",
    "chai-as-promised",
    "chai-http",
    "chai-jest-snapshot",
    "mocha",
];    

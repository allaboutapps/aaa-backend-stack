import { expect } from "@aaa-backend-stack/test-environment";

import * as util from "util";

describe("@aaa-backend-stack/polyfills", function () {

    it("Bluebird promises are set globally #noreset", function () {
        // https://github.com/petkaantonov/bluebird/issues/1237

        expect(Promise.resolve()).to.be.instanceof(require("bluebird"));
        expect(Promise).to.have.ownProperty("version");
    });

    it("Global bluebird promises are been patched with CLS context #noreset", function () {
        // https://github.com/TimBeyer/cls-bluebird

        const str = util.inspect(Promise).toString();
        // console.log(str);
        // no better way of determining it.
        expect(str.indexOf(`cls:`) >= 0).to.equal(true);
        expect(str.indexOf(`Namespace {`) >= 0).to.equal(true);
        expect(str.indexOf(`name: 'NS_`) >= 0).to.equal(true);
    });

    it("ES6 async await are base on patched bluebird promises #noreset", async function () {
        // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/10801
        // bluebird-global typing is installed
        // native Promise is replaced by patch cls supported bluebird in polyfills.ts (first file)

        const test1 = await Promise.resolve("test");
        expect(test1).to.equal("test");

        const test2 = await Promise.resolve("test2");
        expect(test2).to.equal("test2");

        // check for bluebird custom method availablity at await
        const testSeries = await Promise.mapSeries(["test", "test", "test", "test"], (item, index) => {
            return Promise.resolve(item + index);
        });

        expect(testSeries).to.contain("test0");
        expect(testSeries).to.contain("test1");
        expect(testSeries).to.contain("test2");
        expect(testSeries).to.contain("test3");

    });

    it("fetch exists on the global object and uses cls patched bluebird #noreset", () => {
        expect(fetch).to.be.equal(require("node-fetch"));
        expect(fetch.prototype).to.be.equal(require("node-fetch").prototype);
        expect((fetch as any).Promise).to.haveOwnProperty("version");
    });

});

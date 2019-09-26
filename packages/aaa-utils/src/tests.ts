import { expect } from "@aaa-backend-stack/test-environment";

import { getUniqueCollection } from "./getUniqueCollection";
import { synchronized, synchronizedBy } from "./synchronized";

describe("@aaa-backend-stack/utils", function () {
    describe("getUniqueCollection", () => {
        it("should return unique values as expected #noreset", function () {

            const uniqueTestValues1 = getUniqueCollection([{
                a: 1
            }, {
                a: 1
            }, {
                b: 1
            }, {
                a: 2
            }]);

            expect(uniqueTestValues1.length).to.equal(3);
            expect(uniqueTestValues1).to.deep.include.members([{
                a: 1
            }, {
                b: 1
            }, {
                a: 2
            }]);

            const uniqueTestValues2 = getUniqueCollection([]);
            expect(uniqueTestValues2.length).to.equal(0);

            const uniqueTestValues3 = getUniqueCollection([{ a: 1 }]);
            expect(uniqueTestValues3.length).to.equal(1);

            expect(uniqueTestValues1).to.deep.include.members([{
                a: 1
            }]);
        });
    });

    describe("synchronized", () => {
        it("synchronized should wrap to only call once #noreset", async function () {

            let called = 0;

            async function testCaller() {
                await Promise.delay(250);
                called += 1;
                return called;
            }

            const synchTest = synchronized(testCaller);

            const [v1, v2, v3] = await Promise.all([
                synchTest(),
                synchTest(),
                synchTest()
            ]);

            expect(called).to.equal(1);
            expect(v1).to.equal(1);
            expect(v2).to.equal(1);
            expect(v3).to.equal(1);
        });

        it("synchronizedBy should wrap in cacheKey to only call once #noreset", async function () {

            let called = 0;

            async function testCaller() {
                await Promise.delay(250);
                called += 1;
                return called;
            }

            const synchTest = synchronizedBy(testCaller);

            const [v1, v2, v3] = await Promise.all([
                synchTest("context1"),
                synchTest("context1"),
                synchTest("context1"),
                synchTest("context2"),
                synchTest("context2"),
                synchTest("context3")
            ]);

            expect(called).to.equal(3);
        });
    });

});

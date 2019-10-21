import storage from "@aaa-backend-stack/storage";
import { expect } from "@aaa-backend-stack/test-environment";
import * as _ from "lodash";

function getTransactionId(): string | null {
    // tslint:disable-next-line
    const { TRANSACTION_CONTEXT } = require("@aaa-backend-stack/storage");
    const transaction = TRANSACTION_CONTEXT.getTransaction();

    return _.get(transaction, "id", null);
}

// tslint:disable-next-line:max-func-body-length
describe("@aaa-backend-stack/polyfills", function () {

    it("test cls promise patching", async function () {

        // How many parallel transactions to test
        const NUM_PROMISES = 4; // 20;

        // Fill with scopes
        let scopes: string[] = [];
        for (let i = 0; i < NUM_PROMISES; i += 1) {
            scopes.push(i.toString());
        }

        // Sort alphabetically so the comparison after Promise.all() has completed matches the ORDER BY
        scopes = _.sortBy(scopes);

        const promises = scopes.map(async (scope, index) => {

            return storage.transaction(async (t: any) => {
                // Store transaction id and compare after each step
                const tansactionId = t.id;

                // Create a permission
                const permission = await storage.models.Permission.create({ scope });
                expect(tansactionId).to.equal(getTransactionId());

                // fetch against public postman dummy API (fetch ist also patched in polyfills with bluebird)
                await fetch("https://postman-echo.com/get?foo1=bar1&foo2=bar2");
                expect(tansactionId).to.equal(getTransactionId());

                // Modify permission
                await permission.update({ scope: `${scope}_after` });
                expect(tansactionId).to.equal(getTransactionId());

                // Half of the promises throw
                if ((index % 2) === 1) {
                    throw new Error();
                }
            }).catch(err => {
                // Ignore errors otherwise Promise.all() stops at first throw
            });
        });

        await Promise.all(promises);

        // Now verify that all data changes were done as expected
        const created = await storage.models.Permission.findAll({
            where: {
                scope: {
                    $notIn: ["cms", "root"]
                }
            },
            order: "scope ASC"
        });

        // Half of the DB transactions should be rolled back (Math.floor etc. because scopes.length could be an odd number)
        expect(created.length).to.equal(Math.floor((scopes.length + 1) / 2));

        // The rest should've completed correctly
        created.forEach((entry, index) => {
            expect(entry.scope).to.equal(`${scopes[index * 2]}_after`);
        });
    });

    it("test cls context not leaking", async function () {

        await storage.transaction(async (t: any) => {
            // Store transaction id and compare after each step
            const transactionId = t.id;

            // console.log("### id", transactionId);

            // Create a permission
            // tslint:disable-next-line
            await storage.models.Permission.create({ scope: "in_transaction" }, { logging: console.log });
            expect(transactionId).to.equal(getTransactionId());
        });

        expect(getTransactionId()).to.equal(null);

        // In log make sure that this runs in (default) and not iin transacionId
        // tslint:disable-next-line
        await storage.models.Permission.create({ scope: "outside_transaction" }, { logging: console.log });
    });

    it("test cls context opening and closing correctly for unmanaged transactions on rollback", async function () {

        const transaction: any = await storage.transaction();
        // tslint:disable-next-line:no-unused-expression
        expect(transaction).to.be.ok;

        const clsTransaction: any = storage.getTransaction();
        expect(clsTransaction.id).to.equal(transaction.id);

        const TEST_USER_UID = "122598f5-adf4-4be7-8e01-0eef307247a5";
        const user = await storage.models.User.create({ uid: TEST_USER_UID });

        await transaction.rollback();

        // rollback should remove transaction from cls
        expect(storage.getTransaction()).to.equal(null);

        try {
            await user.reload();
        } catch (err) {
            expect(err).to.not.equal(null);
        }

        const count = await storage.models.User.count({ where: { uid: TEST_USER_UID } });
        expect(count).to.equal(0);
    });

    it("test cls context opening and closing correctly for unmanaged transactions on commit", async function () {

        const transaction: any = await storage.transaction();
        // tslint:disable-next-line:no-unused-expression
        expect(transaction).to.be.ok;

        const clsTransaction: any = storage.getTransaction();
        expect(clsTransaction.id).to.equal(transaction.id);

        const TEST_USER_UID = "122598f5-adf4-4be7-8e01-0eef307247a5";
        const user = await storage.models.User.create({ uid: TEST_USER_UID });

        await transaction.commit();

        // rollback should remove transaction from cls
        expect(storage.getTransaction()).to.equal(null);

        await user.reload();
        expect(user).to.not.equal(null);

        const count = await storage.models.User.count({ where: { uid: TEST_USER_UID } });
        expect(count).to.equal(1);
    });
});

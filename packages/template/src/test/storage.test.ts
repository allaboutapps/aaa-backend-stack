import storage, { SEQUELIZE } from "@aaa-backend-stack/storage";
import { expect } from "@aaa-backend-stack/test-environment";

describe("@aaa-backend-stack/storage", function () {
    // tslint:disable-next-line:max-func-body-length
    describe("transaction (test in project)", function () {
        const TEST_USER_UID = "731e10aa-1678-44ee-a8b8-5d0501fc37ad";

        it("should commit successful transaction using autoCallback", async function () {
            const user = await storage.transaction(async (tx) => {
                const transaction1 = storage.getTransaction();
                // tslint:disable-next-line:no-unused-expression
                expect(transaction1).to.be.ok;
                expect((<any>tx).id).to.equal((<any>transaction1).id);

                return storage.models.User.create({ uid: TEST_USER_UID });
            });

            expect(user).to.not.equal(null);

            const transaction = storage.getTransaction();
            // tslint:disable-next-line:no-unused-expression
            expect(transaction).to.not.be.ok;

            const count = await storage.models.User.count({ where: { uid: TEST_USER_UID } });
            expect(count).to.equal(1);
        });

        it("should roll back failed transaction using autoCallback", async function () {
            try {
                const user = await storage.transaction(async (tx) => {
                    const transaction1 = storage.getTransaction();
                    // tslint:disable-next-line:no-unused-expression
                    expect(transaction1).to.be.ok;
                    expect((<any>tx).id).to.equal((<any>transaction1).id);

                    await storage.models.User.create({ uid: TEST_USER_UID });

                    throw new Error();
                });

                expect(user).to.equal(null);
            } catch (err) {
                expect(err).to.not.equal(null);
            }

            const transaction = storage.getTransaction();
            // tslint:disable-next-line:no-unused-expression
            expect(transaction).to.not.be.ok;

            const count = await storage.models.User.count({ where: { uid: TEST_USER_UID } });
            expect(count).to.equal(0);
        });

        it("should set local PG parameter using autoCallback", async function () {
            await storage.transaction({
                parameters: {
                    test_user_uid: TEST_USER_UID
                }
            }, async (tx) => {
                const transaction1 = storage.getTransaction();
                // tslint:disable-next-line:no-unused-expression
                expect(transaction1).to.be.ok;
                expect((<any>tx).id).to.equal((<any>transaction1).id);

                const results1 = await storage.sequelize.query("SELECT current_setting('my.test_user_uid', TRUE);", { type: SEQUELIZE.QueryTypes.SELECT });
                expect(results1).to.have.length(1);
                expect(results1[0].current_setting).to.equal(TEST_USER_UID);
            });

            const transaction = storage.getTransaction();
            // tslint:disable-next-line:no-unused-expression
            expect(transaction).to.not.be.ok;

            const results = await storage.sequelize.query("SELECT current_setting('my.test_user_uid', TRUE);", { type: SEQUELIZE.QueryTypes.SELECT });
            expect(results).to.have.length(1);
            expect(results[0].current_setting).to.satisfy((val: any) => val === "" || val === null);
        });

        it("should return and commit successful unmanaged transaction without autoCallback", async function () {
            const transaction = await storage.transaction();
            // tslint:disable-next-line:no-unused-expression
            expect(transaction).to.be.ok;

            const user = await storage.models.User.create({ uid: TEST_USER_UID });

            await transaction.commit();

            await user.reload();
            expect(user).to.not.equal(null);

            const count = await storage.models.User.count({ where: { uid: TEST_USER_UID } });
            expect(count).to.equal(1);
        });

        it("should return and roll back failed unmanaged transaction without autoCallback", async function () {
            const transaction = await storage.transaction();
            // tslint:disable-next-line:no-unused-expression
            expect(transaction).to.be.ok;

            const user = await storage.models.User.create({ uid: TEST_USER_UID });

            await transaction.rollback();

            try {
                await user.reload();
                expect(user).to.equal(null);
            } catch (err) {
                expect(err).to.not.equal(null);
            }

            const count = await storage.models.User.count({ where: { uid: TEST_USER_UID } });
            expect(count).to.equal(0);
        });

        it("should set local PG parameter in unmanaged transaction without autoCallback", async function () {
            // Create unmanaged transaction including local parameter
            const transaction = await storage.transaction({
                parameters: {
                    test_user_uid: TEST_USER_UID
                }
            });

            // tslint:disable-next-line:no-unused-expression
            expect(transaction).to.be.ok;

            // Transaction is now applied, local parameter applied
            let results = await storage.sequelize.query("SELECT current_setting('my.test_user_uid', TRUE);", { type: SEQUELIZE.QueryTypes.SELECT });
            expect(results).to.have.length(1);
            expect(results[0].current_setting).to.equal(TEST_USER_UID);

            // Commit transaction, local parameter no longer applied for queries after this
            await transaction.commit();

            // Transaction is still set in context, but has already been committed. Local parameter does not apply anymore
            results = await storage.sequelize.query("SELECT current_setting('my.test_user_uid', TRUE);", { type: SEQUELIZE.QueryTypes.SELECT });
            expect(results).to.have.length(1);
            expect(results[0].current_setting).to.satisfy((val: any) => val === "" || val === null);

            // No transaction set anymore, local parameter does not apply
            results = await storage.sequelize.query("SELECT current_setting('my.test_user_uid', TRUE);", { type: SEQUELIZE.QueryTypes.SELECT });
            expect(results).to.have.length(1);
            expect(results[0].current_setting).to.satisfy((val: any) => val === "" || val === null);
        });
    });
});

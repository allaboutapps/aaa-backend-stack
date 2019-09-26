import * as _ from "lodash";

import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { CONFIG } from "../../configure";
import Request from "../../test/Request";

describe("POST /api/v1/auth/login", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");
    const timingAttack = CONFIG.auth.timingAttack;

    afterEach(() => {
        CONFIG.auth.timingAttack = timingAttack;
    });

    it("should perform successful login with existing user", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "user1@test.com", password: "password" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should perform successful login with existing user including scope", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "admin1@test.com", password: "password", scope: "cms" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should return error for missing username #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ password: "password" });
        expect(res).to.have.status(400);
    });

    it("should return error for missing password #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "user1@test.com" });
        expect(res).to.have.status(400);
    });

    it("should return error for non-existing username #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "definitelydoesnotexist@test.com", password: "password" });
        expect(res).to.have.status(401);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidCredentials");
    });

    it("should return error for incorrect password #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "user1@test.com", password: "wrongpassword" });
        expect(res).to.have.status(401);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidCredentials");
    });

    it("should return error for invalid/not granted scope #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "user1@test.com", password: "wrongpassword", scope: "cms" });
        expect(res).to.have.status(401);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidScope");
    });

    it("should return error for deactivated user #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/login").send({ username: "deactivated@test.com", password: "password" });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginDeactivatedUser");
    });

    it("should verify timing attack delays #noreset", async function () {
        // if this test fails, retry - we are dealing with random response times and potentially slow computers - can happen...
        this.retries(1);

        const REQUESTS = 20;
        CONFIG.auth.timingAttack.min = 1;
        CONFIG.auth.timingAttack.max = 2;

        const payload = {
            username: "notavailable.user@test.com",
            password: "anything"
        };

        async function timedAuthRequest(): Promise<number> {
            // tslint:disable-next-line:aaa-no-new-date
            const time = new Date();
            const res = await Request.create("POST", "/api/v1/auth/login").send(payload);

            expect(res).to.have.status(401);

            // tslint:disable-next-line:aaa-no-new-date
            return new Date().getTime() - time.getTime();
        }

        const averageTimesWithoutTimingDelays = await Promise.all(_.times(REQUESTS, async () => {
            return timedAuthRequest();
        }));

        const minNoDelay = _.min(averageTimesWithoutTimingDelays);

        const newMin = 500;
        const newMax = 501;

        // increase the delay by 300ms
        CONFIG.auth.timingAttack.min = newMin;
        CONFIG.auth.timingAttack.max = newMax;

        const averageTimesWithTimingDelays = await Promise.all(_.times(REQUESTS, async () => {
            return timedAuthRequest();
        }));

        const minDelay = _.min(averageTimesWithTimingDelays);

        // test delay was applied...
        expect((minDelay - minNoDelay)).to.be.gte(newMin / 3); // expect at least a third slower responses
    });
});

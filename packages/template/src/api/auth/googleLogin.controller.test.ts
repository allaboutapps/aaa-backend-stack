import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { CONFIG } from "../../configure";
import Request from "../../test/Request";

describe("POST /api/v1/auth/google", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");
    const googleAuthEnabled = CONFIG.auth.google.enabled;

    afterEach(() => {
        CONFIG.auth.google.enabled = googleAuthEnabled;
    });

    it("should perform successful login with new user", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/google").send({ idToken: "valid" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should perform successful login with existing user", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/google").send({ idToken: "validexisting" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should return error for missing ID token #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/google");
        expect(res).to.have.status(400);
    });

    it("should return error for deactivated user #noreset", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/google").send({ idToken: "deactivated" });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginDeactivatedUser");
    });

    it("should return error for invalid ID token #noreset", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/google").send({ idToken: "invalid" });
        expect(res).to.have.status(401);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidCredentials");
    });

    it("should return error if Google authentication is disabled #noreset", async function () {
        if (CONFIG.auth.google.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/google").send({ idToken: "valid" });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginGoogleDeactivated");
    });

    it("should force-test login with new user", async function () {
        // Force-enable Google authentication to test implementation
        CONFIG.auth.google.enabled = true;

        const res = await Request.create("POST", "/api/v1/auth/google").send({ idToken: "valid" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });
});

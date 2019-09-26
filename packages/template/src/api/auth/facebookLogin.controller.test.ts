import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { CONFIG } from "../../configure";
import Request from "../../test/Request";

describe("POST /api/v1/auth/facebook", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");
    const facebookAuthEnabled = CONFIG.auth.facebook.enabled;

    afterEach(() => {
        CONFIG.auth.facebook.enabled = facebookAuthEnabled;
    });

    it("should perform successful login with new user", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/facebook").send({ token: "valid" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should perform successful login with existing user", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/facebook").send({ token: "validexisting" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should return error for missing token #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/facebook");
        expect(res).to.have.status(400);
    });

    it("should return error for deactivated user #noreset", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/facebook").send({ token: "deactivated" });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginDeactivatedUser");
    });

    it("should return error for invalid (ID) token #noreset", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/facebook").send({ token: "invalid" });
        expect(res).to.have.status(401);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidCredentials");
    });

    it("should return error if Facebook authentication is disabled #noreset", async function () {
        if (CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/facebook").send({ token: "valid" });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginFacebookDeactivated");
    });

    it("should force-test login with new user", async function () {
        // Force-enable Facebook authentication to test implementation
        CONFIG.auth.facebook.enabled = true;

        const res = await Request.create("POST", "/api/v1/auth/facebook").send({ token: "valid" });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });
});

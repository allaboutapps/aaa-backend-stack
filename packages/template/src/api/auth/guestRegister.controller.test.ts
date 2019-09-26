import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import CONFIG from "../../configure";
import Request from "../../test/Request";

describe("POST /api/v1/auth/guest", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");
    const guestAuthEnabled = CONFIG.auth.allowGuestAuth;

    afterEach(() => {
        CONFIG.auth.allowGuestAuth = guestAuthEnabled;
    });

    it("should create guest user (if enabled)", async function () {
        if (!CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/guest");
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.equal(null);
    });

    it("should return error while creating guest user (if disabled) #noreset", async function () {
        if (CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/guest");
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginGuestAuthDisabled");
    });

    it("should force-test guest user creation", async function () {
        // Force-enable guest authentication to test implementation
        CONFIG.auth.allowGuestAuth = true;

        const res = await Request.create("POST", "/api/v1/auth/guest");
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.equal(null);
    });
});

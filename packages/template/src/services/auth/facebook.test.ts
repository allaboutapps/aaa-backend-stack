import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { CONFIG } from "../../configure";
import * as fixtures from "../../test/fixtures";
import FacebookAuthenticationService from "./facebook";

describe("FacebookAuthenticationService", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("AuthenticationService.snap");
    const facebookAuthEnabled = CONFIG.auth.facebook.enabled;

    afterEach(() => {
        CONFIG.auth.facebook.enabled = facebookAuthEnabled;
    });

    it("should return user for successful login with new user", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const user = await FacebookAuthenticationService.authenticate({ token: "valid" });
        expect(user.username).to.equal(null);
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.facebookId).to.equal("doesnotexistfacebookid");
    });

    it("should return user for successful login with new user with email", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const user = await FacebookAuthenticationService.authenticate({ token: "validwithemail" });
        expect(user.username).to.equal("newfacebook@test.com");
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.facebookId).to.equal("doesnotexisteitherfacebookid");
    });

    it("should return user for successful login with existing user", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const user = await FacebookAuthenticationService.authenticate({ token: "validexisting" });
        expect(user.uid).to.equal(fixtures.facebookUser.uid);
        expect(user.username).to.equal("facebook@test.com");
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.facebookId).to.equal("superuniquefacebookid");
    });

    it("should return user for successful login with existing email", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        const user = await FacebookAuthenticationService.authenticate({ token: "validexistingemail" });
        expect(user.uid).to.equal(fixtures.facebookUser.uid);
        expect(user.username).to.equal("facebook@test.com");
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.facebookId).to.equal("definitelydoesnotexistfacebookid");
    });

    it("should throw error for deactivated user", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        try {
            const user = await FacebookAuthenticationService.authenticate({ token: "deactivated" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
        }
    });

    it("should throw error for invalid ID token #noreset", async function () {
        if (!CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        try {
            const user = await FacebookAuthenticationService.authenticate({ token: "invalid" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
        }
    });

    it("should throw error if Facebook authentication is disabled #noreset", async function () {
        if (CONFIG.auth.facebook.enabled) {
            this.skip();
        }

        try {
            const user = await FacebookAuthenticationService.authenticate({ token: "valid" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceForbiddenFacebookDeactivated");
        }
    });

    it("should force-test login with new user", async function () {
        // Force-enable Facebook authentication to test implementation
        CONFIG.auth.facebook.enabled = true;

        const user = await FacebookAuthenticationService.authenticate({ token: "valid" });
        expect(user.username).to.equal(null);
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.facebookId).to.equal("doesnotexistfacebookid");
    });
});

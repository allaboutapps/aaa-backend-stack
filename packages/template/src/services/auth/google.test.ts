import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { CONFIG } from "../../configure";
import * as fixtures from "../../test/fixtures";
import GoogleAuthenticationService from "./google";

describe("GoogleAuthenticationService", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("AuthenticationService.snap");
    CONFIG.auth.google.enabled = true;
    const googleAuthEnabled = CONFIG.auth.google.enabled;

    afterEach(() => {
        CONFIG.auth.google.enabled = googleAuthEnabled;
    });

    it("should return user for successful login with new user", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const user = await GoogleAuthenticationService.authenticate({ idToken: "valid" });
        expect(user.username).to.equal(null);
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.googleId).to.equal("doesnotexistgoogleid");
    });

    it("should return user for successful login with new user with email", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const user = await GoogleAuthenticationService.authenticate({ idToken: "validwithemail" });
        expect(user.username).to.equal("newgoogle@test.com");
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.googleId).to.equal("doesnotexisteithergoogleid");
    });

    it("should return user for successful login with existing user", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const user = await GoogleAuthenticationService.authenticate({ idToken: "validexisting" });
        expect(user.uid).to.equal(fixtures.googleUser.uid);
        expect(user.username).to.equal("google@test.com");
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.googleId).to.equal("superuniquegoogleid");
    });

    it("should return user for successful login with existing email", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        const user = await GoogleAuthenticationService.authenticate({ idToken: "validexistingemail" });
        expect(user.uid).to.equal(fixtures.googleUser.uid);
        expect(user.username).to.equal("google@test.com");
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.googleId).to.equal("definitelydoesnotexistgoogleid");
    });

    it("should throw error for deactivated user", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        try {
            const user = await GoogleAuthenticationService.authenticate({ idToken: "deactivated" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
        }
    });

    it("should throw error for invalid ID token #noreset", async function () {
        if (!CONFIG.auth.google.enabled) {
            this.skip();
        }

        try {
            const user = await GoogleAuthenticationService.authenticate({ idToken: "invalid" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
        }
    });

    it("should throw error if Google authentication is disabled #noreset", async function () {
        if (CONFIG.auth.google.enabled) {
            this.skip();
        }

        try {
            const user = await GoogleAuthenticationService.authenticate({ idToken: "valid" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceForbiddenGoogleDeactivated");
        }
    });

    it("should force-test login with new user", async function () {
        // Force-enable Google authentication to test implementation
        CONFIG.auth.google.enabled = true;

        const user = await GoogleAuthenticationService.authenticate({ idToken: "valid" });
        expect(user.username).to.equal(null);
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
        expect(user.googleId).to.equal("doesnotexistgoogleid");
    });
});

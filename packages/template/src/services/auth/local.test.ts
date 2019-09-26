import storage from "@aaa-backend-stack/storage";
import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import CONFIG from "../../configure";
import * as fixtures from "../../test/fixtures";
import LocalAuthenticationService from "./local";

// tslint:disable-next-line:max-func-body-length
describe("LocalAuthenticationService", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("AuthenticationService.snap");
    const guestAuthEnabled = CONFIG.auth.allowGuestAuth;

    afterEach(() => {
        CONFIG.auth.allowGuestAuth = guestAuthEnabled;
    });

    it("should return user for successful login #noreset", async function () {
        const user = await LocalAuthenticationService.authenticate({ username: "user1@test.com", password: "password" });
        expect(user.uid).to.equal(fixtures.user1.uid);
    });

    it("should return user for successful refresh token login", async function () {
        const user = await LocalAuthenticationService.authenticateWithRefreshToken(fixtures.user1.RefreshToken.token);
        expect(user.uid).to.equal(fixtures.user1.uid);
    });

    it("should return user for successful admin login #noreset", async function () {
        const user = await LocalAuthenticationService.authenticate({ username: "admin1@test.com", password: "password" });
        expect(user.uid).to.equal(fixtures.admin1.uid);
    });

    it("should return user for successful admin refresh token login", async function () {
        const user = await LocalAuthenticationService.authenticateWithRefreshToken(fixtures.admin1.RefreshToken.token);
        expect(user.uid).to.equal(fixtures.admin1.uid);
    });

    it("should create guest user (if enabled)", async function () {
        if (!CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        const user = await LocalAuthenticationService.createGuestUser();
        expect(user.uid).to.not.equal(null);
        expect(user.username).to.equal(null);
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);
    });

    it("should register new user", async function () {
        const user = await LocalAuthenticationService.register({ username: "newuniqueemail@test.com", password: "superSecurePassword" });
        expect(user).to.not.equal(null);

        const userCount = await storage.models.User.count();
        expect(userCount).to.equal(10);
    });

    it("should throw error for unknown user #noreset", async function () {
        try {
            const user = await LocalAuthenticationService.authenticate({ username: "definitelydoesnotexist@test.com", password: "password" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
        }
    });

    it("should throw error for unknown refresh token #noreset", async function () {
        try {
            const user = await LocalAuthenticationService.authenticateWithRefreshToken("5dfb214f-6601-41c3-91ac-dc052d412dc4");
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidRefreshToken");
        }
    });

    it("should throw error when trying to authenticate with same refresh token twice", async function () {
        const user = await LocalAuthenticationService.authenticateWithRefreshToken(fixtures.user1.RefreshToken.token);
        expect(user.uid).to.equal(fixtures.user1.uid);

        try {
            const secondUser = await LocalAuthenticationService.authenticateWithRefreshToken(fixtures.user1.RefreshToken.token);
            expect(secondUser).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidRefreshToken");
        }
    });

    it("should throw error for user without password/salt #noreset", async function () {
        try {
            const user = await LocalAuthenticationService.authenticate({ username: "google@test.com", password: "password" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
        }
    });

    it("should throw error for deactivated user #noreset", async function () {
        try {
            const user = await LocalAuthenticationService.authenticate({ username: "deactivated@test.com", password: "password" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
        }
    });

    it("should throw error for deactivated refresh token user #noreset", async function () {
        try {
            const user = await LocalAuthenticationService.authenticateWithRefreshToken(fixtures.deactivated.RefreshToken.token);
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
        }
    });

    it("should throw error while creating guest user (if disabled) #noreset", async function () {
        if (CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        try {
            const user = await LocalAuthenticationService.createGuestUser();
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceGuestAuthDisabled");
        }
    });

    it("should throw error for existing username during registration #noreset", async function () {
        try {
            const user = await LocalAuthenticationService.register({ username: "user1@test.com", password: "superSecurePassword" });
            expect(user).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceRegisterUsernameExists");
        }
    });

    it("should throw error for weak password during registration #noreset", async function () {
        if (CONFIG.auth.passwordStrengthMinimumScore <= 0) {
            this.skip();
        }

        try {
            const result = await LocalAuthenticationService.register({ username: "weakpassword@test.com", password: "password" });
            expect(result).to.equal(null);
        } catch (err) {
            expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceRegisterWeakPassword");
        }
    });

    it("should force-test guest user creation", async function () {
        // Force-enable guest authentication to test implementation
        CONFIG.auth.allowGuestAuth = true;

        const user = await LocalAuthenticationService.createGuestUser();
        expect(user.uid).to.not.equal(null);
        expect(user.username).to.equal(null);
        expect(user.password).to.equal(null);
        expect(user.salt).to.equal(null);

        const userCount = await storage.models.User.count();
        expect(userCount).to.equal(10);
    });
});

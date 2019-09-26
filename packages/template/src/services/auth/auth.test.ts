import * as _ from "lodash";

import * as serverdate from "@aaa-backend-stack/serverdate";
import storage from "@aaa-backend-stack/storage";
import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import CONFIG from "../../configure";
import { UIDS as MIGRATION_011_UIDS } from "../../migrations/010-insert-administration-user";
import * as fixtures from "../../test/fixtures";
import { AUTHENTICATION_TYPES } from "./_types";
import AuthenticationService from "./auth";

describe("AuthenticationService", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("AuthenticationService.snap");

    // tslint:disable-next-line:max-func-body-length
    describe("authenticate", function () {
        // tslint:disable-next-line:max-func-body-length
        describe("authType: facebook", function () {
            const facebookAuthEnabled = CONFIG.auth.facebook.enabled;

            afterEach(() => {
                CONFIG.auth.facebook.enabled = facebookAuthEnabled;
            });

            it("should return user for successful login with new user", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "valid" });
                expect(result.user.username).to.equal(null);
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.facebookId).to.equal("doesnotexistfacebookid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login with new user with email", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "validwithemail" });
                expect(result.user.username).to.equal("newfacebook@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.facebookId).to.equal("doesnotexisteitherfacebookid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login with existing user", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "validexisting" });
                expect(result.user.uid).to.equal(fixtures.facebookUser.uid);
                expect(result.user.username).to.equal("facebook@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.facebookId).to.equal("superuniquefacebookid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful admin login with existing user", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                const facebookUser = await storage.models.User.findById(fixtures.facebookUser.uid);
                await facebookUser.addPermission(MIGRATION_011_UIDS.PERMISSION_CMS);

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "validexisting" }, ["cms"]);
                expect(result.user.uid).to.equal(fixtures.facebookUser.uid);
                expect(result.user.username).to.equal("facebook@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.facebookId).to.equal("superuniquefacebookid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login with existing email", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "validexistingemail" });
                expect(result.user.uid).to.equal(fixtures.facebookUser.uid);
                expect(result.user.username).to.equal("facebook@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.facebookId).to.equal("definitelydoesnotexistfacebookid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should throw error for user with invalid scopes #noreset", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "valid" }, ["cms"]);
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error for deactivated user #noreset", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "deactivated" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
                }
            });

            it("should throw error for invalid ID token #noreset", async function () {
                if (!CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "invalid" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error if Facebook authentication is disabled #noreset", async function () {
                if (CONFIG.auth.facebook.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "valid" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceForbiddenFacebookDeactivated");
                }
            });

            it("should force-test login with new user", async function () {
                // Force-enable Facebook authentication to test implementation
                CONFIG.auth.facebook.enabled = true;

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, { token: "valid" });
                expect(result.user.username).to.equal(null);
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.facebookId).to.equal("doesnotexistfacebookid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });
        });

        // tslint:disable-next-line:max-func-body-length
        describe("authType: google", function () {
            const googleAuthEnabled = CONFIG.auth.google.enabled;

            afterEach(() => {
                CONFIG.auth.google.enabled = googleAuthEnabled;
            });

            it("should return user for successful login with new user", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "valid" });
                expect(result.user.username).to.equal(null);
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.googleId).to.equal("doesnotexistgoogleid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login with new user with email", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "validwithemail" });
                expect(result.user.username).to.equal("newgoogle@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.googleId).to.equal("doesnotexisteithergoogleid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login with existing user", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "validexisting" });
                expect(result.user.uid).to.equal(fixtures.googleUser.uid);
                expect(result.user.username).to.equal("google@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.googleId).to.equal("superuniquegoogleid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful admin login with existing user", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                const googleUser = await storage.models.User.findById(fixtures.googleUser.uid);
                await googleUser.addPermission(MIGRATION_011_UIDS.PERMISSION_CMS);

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "validexisting" }, ["cms"]);
                expect(result.user.uid).to.equal(fixtures.googleUser.uid);
                expect(result.user.username).to.equal("google@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.googleId).to.equal("superuniquegoogleid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login with existing email", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "validexistingemail" });
                expect(result.user.uid).to.equal(fixtures.googleUser.uid);
                expect(result.user.username).to.equal("google@test.com");
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.googleId).to.equal("definitelydoesnotexistgoogleid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should throw error for user with invalid scopes #noreset", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "valid" }, ["cms"]);
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error for deactivated user #noreset", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "deactivated" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
                }
            });

            it("should throw error for invalid ID token #noreset", async function () {
                if (!CONFIG.auth.google.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "invalid" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error if Google authentication is disabled #noreset", async function () {
                if (CONFIG.auth.google.enabled) {
                    this.skip();
                }

                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "valid" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceForbiddenGoogleDeactivated");
                }
            });

            it("should force-test login with new user", async function () {
                // Force-enable Google authentication to test implementation
                CONFIG.auth.google.enabled = true;

                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, { idToken: "valid" });
                expect(result.user.username).to.equal(null);
                expect(result.user.password).to.equal(null);
                expect(result.user.salt).to.equal(null);
                expect(result.user.googleId).to.equal("doesnotexistgoogleid");
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });
        });

        describe("authType: local", function () {
            const timingAttack = CONFIG.auth.timingAttack;

            afterEach(() => {
                CONFIG.auth.timingAttack = timingAttack;
            });

            it("should return user for successful login", async function () {
                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, { username: "user1@test.com", password: "password" });
                expect(result.user.uid).to.equal(fixtures.user1.uid);
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful admin login", async function () {
                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, { username: "admin1@test.com", password: "password" }, ["cms"]);
                expect(result.user.uid).to.equal(fixtures.admin1.uid);
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should throw error for unknown user #noreset", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, { username: "definitelydoesnotexist@test.com", password: "password" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error for user with invalid scopes #noreset", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, { username: "user1@test.com", password: "password" }, ["cms"]);
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error for user without password/salt #noreset", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, { username: "google@test.com", password: "password" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                }
            });

            it("should throw error for deactivated user #noreset", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, { username: "deactivated@test.com", password: "password" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
                }
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
                    try {
                        const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, payload);
                        expect(result).to.equal(null);
                    } catch (err) {
                        expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidCredentials");
                    }

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

        describe("authType: refreshToken", function () {
            it("should return user for successful login", async function () {
                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.user1.RefreshToken.token });
                expect(result.user.uid).to.equal(fixtures.user1.uid);
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful admin login", async function () {
                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.admin1.RefreshToken.token }, ["cms"]);
                expect(result.user.uid).to.equal(fixtures.admin1.uid);
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should return user for successful login for user without password/salt", async function () {
                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.googleUser.RefreshToken.token });
                expect(result.user.uid).to.equal(fixtures.googleUser.uid);
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);
            });

            it("should throw error for unknown refresh token #noreset", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: "d2286abd-7503-4569-b710-a529288bcb8d" });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidRefreshToken");
                }
            });

            it("should throw error when trying to authenticate with same refresh token twice", async function () {
                const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.user1.RefreshToken.token });
                expect(result.user.uid).to.equal(fixtures.user1.uid);
                expect(result.accessToken).to.not.equal(null);
                expect(result.refreshToken).to.not.equal(null);

                try {
                    const result2 = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.user1.RefreshToken.token }, ["cms"]);
                    expect(result2).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidRefreshToken");
                }
            });

            it("should throw error for user with invalid scopes", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.user1.RefreshToken.token }, ["cms"]);
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedInvalidRefreshToken");
                }
            });

            it("should throw error for deactivated user", async function () {
                try {
                    const result = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, { refreshToken: fixtures.deactivated.RefreshToken.token });
                    expect(result).to.equal(null);
                } catch (err) {
                    expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceUnauthorizedUserDeactivated");
                }
            });
        });
    });

    describe("createGuestUser", function () {
        const guestAuthEnabled = CONFIG.auth.allowGuestAuth;

        afterEach(() => {
            CONFIG.auth.allowGuestAuth = guestAuthEnabled;
        });

        it("should create guest user (if enabled)", async function () {
            if (!CONFIG.auth.allowGuestAuth) {
                this.skip();
            }

            const result = await AuthenticationService.createGuestUser();
            expect(result.user.uid).to.not.equal(null);
            expect(result.user.username).to.equal(null);
            expect(result.user.password).to.equal(null);
            expect(result.user.salt).to.equal(null);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.equal(null);

            const userCount = await storage.models.User.count();
            expect(userCount).to.equal(10);
        });

        it("should throw error while creating guest user (if disabled) #noreset", async function () {
            if (CONFIG.auth.allowGuestAuth) {
                this.skip();
            }

            try {
                const result = await AuthenticationService.createGuestUser();
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceGuestAuthDisabled");
            }
        });

        it("should force-test guest user creation", async function () {
            // Force-enable guest authentication to test implementation
            CONFIG.auth.allowGuestAuth = true;

            const result = await AuthenticationService.createGuestUser();
            expect(result.user.uid).to.not.equal(null);
            expect(result.user.username).to.equal(null);
            expect(result.user.password).to.equal(null);
            expect(result.user.salt).to.equal(null);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.equal(null);

            const userCount = await storage.models.User.count();
            expect(userCount).to.equal(10);
        });
    });

    describe("generateAuthTokens", function () {
        it("should generate auth tokens for regular user", async function () {
            const result = await AuthenticationService.generateAuthTokens(fixtures.user1.uid);
            expect(result.user.uid).to.equal(fixtures.user1.uid);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.not.equal(null);
        });

        it("should generate auth tokens for admin user", async function () {
            const result = await AuthenticationService.generateAuthTokens(fixtures.admin1.uid);
            expect(result.user.uid).to.equal(fixtures.admin1.uid);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.not.equal(null);
        });

        it("should generate auth tokens for OpenID user", async function () {
            const result = await AuthenticationService.generateAuthTokens(fixtures.googleUser.uid);
            expect(result.user.uid).to.equal(fixtures.googleUser.uid);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.not.equal(null);
        });

        it("should return existing access token for guest user", async function () {
            const result = await AuthenticationService.generateAuthTokens(fixtures.guest1.uid);
            expect(result.user.uid).to.equal(fixtures.guest1.uid);
            expect(result.accessToken).to.not.equal(fixtures.guest1.AccessToken.token);
            expect(result.refreshToken).to.equal(null);
        });

        it("should throw error for unknown user #noreset", async function () {
            try {
                const result = await AuthenticationService.generateAuthTokens("aead3f71-0df3-4dba-a493-8ae1b8aa922b");
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceGenerateAuthTokensUserNotFound");
            }
        });
    });

    describe("logout", function () {
        it("should perform logout", async function () {
            await AuthenticationService.logout(fixtures.user1.uid, fixtures.user1.AccessToken.token, fixtures.user1.RefreshToken.token);

            const [accessTokenCount, refreshTokenCount] = await Promise.all([
                storage.models.AccessToken.count({
                    where: {
                        UserUid: fixtures.user1.uid
                    }
                }),
                storage.models.RefreshToken.count({
                    where: {
                        UserUid: fixtures.user1.uid
                    }
                })
            ]);

            expect(accessTokenCount).to.equal(0);
            expect(refreshTokenCount).to.equal(0);
        });

        it("should perform guest logout", async function () {
            await AuthenticationService.logout(fixtures.guest1.uid, fixtures.guest1.AccessToken.token, null);

            const [userCount, accessTokenCount, refreshTokenCount] = await Promise.all([
                storage.models.User.count({
                    where: {
                        uid: fixtures.guest1.uid
                    }
                }),
                storage.models.AccessToken.count({
                    where: {
                        UserUid: fixtures.guest1.uid
                    }
                }),
                storage.models.RefreshToken.count({
                    where: {
                        UserUid: fixtures.guest1.uid
                    }
                })
            ]);

            expect(userCount).to.equal(0);
            expect(accessTokenCount).to.equal(0);
            expect(refreshTokenCount).to.equal(0);
        });

        it("should throw error while performing logout with different user's access token #noreset", async function () {
            try {
                await AuthenticationService.logout(fixtures.user1.uid, fixtures.user2.AccessToken.token, fixtures.user1.RefreshToken.token);
                expect(true).to.equal(false);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceInvalidLogout");
            }
        });

        it("should throw error while performing logout with different user's refresh token #noreset", async function () {
            try {
                await AuthenticationService.logout(fixtures.user1.uid, fixtures.user1.AccessToken.token, fixtures.user2.RefreshToken.token);
                expect(true).to.equal(false);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceInvalidLogout");
            }
        });
    });

    describe("register", function () {
        it("should register new user", async function () {
            const result = await AuthenticationService.register({ username: "newuniqueemail@test.com", password: "superSecurePassword" });
            expect(result.user).to.not.equal(null);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.not.equal(null);

            const userCount = await storage.models.User.count();
            expect(userCount).to.equal(10);
        });

        it("should throw error for existing username #noreset", async function () {
            try {
                const result = await AuthenticationService.register({ username: "user1@test.com", password: "superSecurePassword" });
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceRegisterUsernameExists");
            }
        });

        it("should throw error for weak password #noreset", async function () {
            if (CONFIG.auth.passwordStrengthMinimumScore <= 0) {
                this.skip();
            }

            try {
                const result = await AuthenticationService.register({ username: "weakpassword@test.com", password: "password" });
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceRegisterWeakPassword");
            }
        });
    });

    describe("initiatePasswordReset", function () {
        it("should initiate password reset for existing user", async function () {
            await storage.models.PasswordResetToken.destroy({ where: {} });

            const success = await AuthenticationService.initiatePasswordReset(fixtures.user1.username);
            expect(success).to.equal(true);

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({ where: { UserUid: fixtures.user1.uid } });
            expect(passwordResetTokenCount).to.equal(1);
        });

        it("should not create second password reset token while first one is still valid", async function () {
            await storage.models.PasswordResetToken.destroy({ where: {} });

            const success = await AuthenticationService.initiatePasswordReset(fixtures.user1.username);
            expect(success).to.equal(true);

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({ where: { UserUid: fixtures.user1.uid } });
            expect(passwordResetTokenCount).to.equal(1);

            const success2 = await AuthenticationService.initiatePasswordReset(fixtures.user1.username);
            expect(success2).to.equal(true);

            const passwordResetTokenCount2 = await storage.models.PasswordResetToken.count({ where: { UserUid: fixtures.user1.uid } });
            expect(passwordResetTokenCount2).to.equal(1);
        });

        it("should initiate password reset for non-existing user", async function () {
            await storage.models.PasswordResetToken.destroy({ where: {} });

            const success = await AuthenticationService.initiatePasswordReset("doesnotexistmail@domain.invalid");
            expect(success).to.equal(false);

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count();
            expect(passwordResetTokenCount).to.equal(0);
        });

        it("should not initiate password reset non email user-name admin", async function () {
            await storage.models.PasswordResetToken.destroy({ where: {} });

            const success = await AuthenticationService.initiatePasswordReset("admin");
            expect(success).to.equal(false);

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count();
            expect(passwordResetTokenCount).to.equal(0);
        });
    });

    describe("completePasswordReset", function () {
        it("should complete password reset for existing user", async function () {
            const result = await AuthenticationService.completePasswordReset({
                token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
                password: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422",
                passwordConfirmation: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422"
            });
            expect(result.user.uid).to.equal(fixtures.user1.uid);
            expect(result.user.password).to.not.equal(fixtures.user1.password);
            expect(result.user.salt).to.not.equal(fixtures.user1.salt);
            expect(result.accessToken).to.not.equal(null);
            expect(result.refreshToken).to.not.equal(null);

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({
                where: {
                    UserUid: fixtures.user1.uid,
                    validUntil: {
                        $gte: serverdate.getMoment().toISOString()
                    }
                }
            });
            expect(passwordResetTokenCount).to.equal(0);
        });

        it("should throw error for weak password", async function () {
            try {
                const result = await AuthenticationService.completePasswordReset({
                    token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
                    password: "password1",
                    passwordConfirmation: "password1"
                });
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceConflictWeakPassword");
            }

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({
                where: {
                    UserUid: fixtures.user1.uid,
                    validUntil: {
                        $gte: serverdate.getMoment().toISOString()
                    }
                }
            });
            expect(passwordResetTokenCount).to.equal(1);
        });

        it("should throw error for password confirmation mismatch", async function () {
            try {
                const result = await AuthenticationService.completePasswordReset({
                    token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
                    password: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422",
                    passwordConfirmation: "3f3f5b07-c5a4-42b1-8efa-f648a3c53423"
                });
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceConflictConfirmationMismatch");
            }

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({
                where: {
                    UserUid: fixtures.user1.uid,
                    validUntil: {
                        $gte: serverdate.getMoment().toISOString()
                    }
                }
            });
            expect(passwordResetTokenCount).to.equal(1);
        });

        it("should throw error for unknown token", async function () {
            try {
                const result = await AuthenticationService.completePasswordReset({
                    token: "7a7e78af-601e-44a7-9478-cfd5bebceb5c",
                    password: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422",
                    passwordConfirmation: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422"
                });
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceNotFoundPasswordResetToken");
            }

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({
                where: {
                    UserUid: fixtures.user1.uid,
                    validUntil: {
                        $gte: serverdate.getMoment().toISOString()
                    }
                }
            });
            expect(passwordResetTokenCount).to.equal(1);
        });

        it("should throw error for expired token", async function () {
            try {
                const result = await AuthenticationService.completePasswordReset({
                    token: fixtures.user1.PasswordResetToken[1].token,
                    password: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422",
                    passwordConfirmation: "3f3f5b07-c5a4-42b1-8efa-f648a3c53422"
                });
                expect(result).to.equal(null);
            } catch (err) {
                expect(snapshots.prepareSnapshot(err.output)).to.matchSnapshot(SNAPSHOT_FILE, "AuthenticationServiceNotFoundPasswordResetToken");
            }

            const passwordResetTokenCount = await storage.models.PasswordResetToken.count({
                where: {
                    UserUid: fixtures.user1.uid,
                    validUntil: {
                        $gte: serverdate.getMoment().toISOString()
                    }
                }
            });
            expect(passwordResetTokenCount).to.equal(1);
        });
    });
});

import storage from "@aaa-backend-stack/storage";
import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { CONFIG } from "../../configure";
import * as fixtures from "../../test/fixtures";
import Request from "../../test/Request";

// tslint:disable-next-line:max-func-body-length
describe("POST /api/v1/auth/logout", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");

    it("should log out user", async function () {
        const res = await Request.create("POST", "/api/v1/auth/logout", { user: "user1" }).send({ refreshToken: fixtures.user1.RefreshToken.token });
        expect(res).to.have.status(200);

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

    it("should log out user via URL parameter", async function () {
        const res = await Request.create("POST", `/api/v1/auth/logout?refreshToken=${fixtures.user1.RefreshToken.token}`, { user: "user1" });
        expect(res).to.have.status(200);

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

    it("should verify token invalidation after logout", async function () {
        const res = await Request.create("POST", "/api/v1/auth/logout", { user: "user1" }).send({ refreshToken: fixtures.user1.RefreshToken.token });
        expect(res).to.have.status(200);

        const res2 = await Request.create("POST", "/api/v1/auth/logout", { user: "user1" }).send({ refreshToken: fixtures.user1.RefreshToken.token });
        expect(res2).to.have.status(401);

        const res3 = await Request.create("POST", "/api/v1/auth/refresh").send({ refreshToken: fixtures.user1.RefreshToken.token });
        expect(res3).to.have.status(401);
    });

    it("should log out guest user (if enabled)", async function () {
        if (!CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/logout", { user: "guest1" });
        expect(res).to.have.status(200);

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

    it("should verify token invalidation after guest logout (if enabled)", async function () {
        if (!CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/logout", { user: "guest1" }).send({ refreshToken: fixtures.user1.RefreshToken.token });
        expect(res).to.have.status(200);

        const res2 = await Request.create("POST", "/api/v1/auth/logout", { user: "guest1" }).send({ refreshToken: fixtures.user1.RefreshToken.token });
        expect(res2).to.have.status(401);
    });

    it("should return error without authentication #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/logout");
        expect(res).to.have.status(401);
    });

    it("should return error while performing logout with different user's refresh token #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/logout", { user: "user1" }).send({ refreshToken: fixtures.user2.RefreshToken.token });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LogoutInvalid");
    });

    it("should return error during logout of guest user (if disabled) #noreset", async function () {
        if (CONFIG.auth.allowGuestAuth) {
            this.skip();
        }

        const res = await Request.create("POST", "/api/v1/auth/logout", { user: "guest1" });
        expect(res).to.have.status(403);
    });
});

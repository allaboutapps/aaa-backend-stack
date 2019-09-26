import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { deactivated, user1 } from "../../test/fixtures";
import Request from "../../test/Request";

describe("POST /api/v1/auth/refresh", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");

    it("should perform successful token refresh for existing user", async function () {
        const res = await Request.create("POST", "/api/v1/auth/refresh").send({ refreshToken: user1.RefreshToken.token });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);
    });

    it("should verify token invalidation after refresh", async function () {
        const res = await Request.create("POST", "/api/v1/auth/refresh").send({ refreshToken: user1.RefreshToken.token });
        expect(res).to.have.status(200);
        expect(res.body.accessToken).to.not.equal(null);
        expect(res.body.refreshToken).to.not.equal(null);

        const res2 = await Request.create("POST", "/api/v1/auth/refresh").send({ refreshToken: user1.RefreshToken.token });
        expect(res2).to.have.status(401);
        expect(snapshots.prepareSnapshot(res2.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidRefreshToken");
    });

    it("should return error for missing refresh token #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/refresh");
        expect(res).to.have.status(400);
    });

    it("should return error for invalid refresh token #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/refresh").send({ refreshToken: "f1445557-2ae9-44a7-a4db-974f7e284253" });
        expect(res).to.have.status(401);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginInvalidRefreshToken");
    });

    it("should return error for deactivated user #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/refresh").send({ refreshToken: deactivated.RefreshToken.token });
        expect(res).to.have.status(403);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "LoginDeactivatedUser");
    });
});

import * as _ from "lodash";

import storage from "@aaa-backend-stack/storage";
import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("POST /api/v1/auth/register", function () {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("Auth.snap");

    const testRegistration = {
        username: "test",
        password: "adsdhas9d8a39h9"
    };

    it("should register new user", async function () {
        const res = await Request.create("POST", "/api/v1/auth/register").send(testRegistration);
        expect(res).to.have.status(200);
        expect(res.body).to.contain.keys("expiresIn", "accessToken", "refreshToken", "tokenType");
    });

    it("should create AppUserProfile during registration", async function () {
        const res = await Request.create("POST", "/api/v1/auth/register").send(testRegistration);
        expect(res).to.have.status(200);
        expect(res.body).to.contain.keys("expiresIn", "accessToken", "refreshToken", "tokenType");

        const fetchedAccessToken = res.body.accessToken;
        const countProfiles = await storage.models.AppUserProfile.count({
            include: [{
                model: storage.models.User,
                include: [{
                    model: storage.models.AccessToken,
                    where: {
                        token: fetchedAccessToken
                    }
                }]
            }]
        });
        expect(countProfiles).to.equal(1);

        const user = await storage.models.User.findOne({
            include: [{
                model: storage.models.AccessToken,
                where: {
                    token: fetchedAccessToken
                }
            }]
        });

        const val = await (<any>user).hasAppUserProfile();
        expect(val).to.equal(true);
    });

    it("should return error for already registered username (case insensitive) #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/register").send(_.assign({}, testRegistration, {
            username: "user1@test.com",
            password: "testtest"
        }));
        expect(res).to.have.status(409);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "RegisterUsernameExists");
    });

    it("should return error for missing username #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/register").send(_.assign({}, testRegistration, {
            username: undefined
        }));
        expect(res).to.have.status(400);
    });

    it("should return error for missing password #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/register").send(_.assign({}, testRegistration, {
            password: undefined
        }));
        expect(res).to.have.status(400);
    });

    it("should return error for password shorter than trimmed 6 letters #noreset", async function () {
        const res = await Request.create("POST", "/api/v1/auth/register").send(_.assign({}, testRegistration, {
            password: "   tinyaaa   "
        }));
        expect(res).to.have.status(400);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "RegisterMissing");
    });
});

import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("POST /api/v1/auth/forgot-password/complete", () => {
    const SNAPSHOT_FILE = snapshots.getSnapshotFile("AuthPasswordReset.snap");
    const NEW_PASSWORD = "ali33adja3d09a0";

    it("should reset password via API call", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys("refreshToken", "accessToken", "expiresIn", "tokenType");

        const res2 = await Request.create("POST", "/api/v1/auth/login").send({
            username: "user1@test.com",
            password: NEW_PASSWORD
        });
        expect(res2).to.have.status(200);

        const res3 = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res3).to.have.status(404);
        expect(snapshots.prepareSnapshot(res3.body)).to.matchSnapshot(SNAPSHOT_FILE, "passwordResetTokenNotFound");
    });

    it("should reset password via web form", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").set("Accept", "text/html").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res).to.have.status(200);
        expect(res.type).to.equal("text/html");

        const res2 = await Request.create("POST", "/api/v1/auth/login").send({
            username: "user1@test.com",
            password: NEW_PASSWORD
        });
        expect(res2).to.have.status(200);

        const res3 = await Request.create("POST", "/api/v1/auth/forgot-password/complete").set("Accept", "text/html").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res3).to.have.status(404);
        expect(res3.type).to.equal("text/html");
    });

    it("should return 400 if the token is missing #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            password: "password2",
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res).to.have.status(400);
    });

    it("should return 400 if the password is missing #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res).to.have.status(400);
    });

    it("should return 400 if the password confirmation is missing #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: NEW_PASSWORD
        });
        expect(res).to.have.status(400);
    });

    it("should return 409 if the password confirmation does not match #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: NEW_PASSWORD,
            passwordConfirmation: "doesNotMatch"
        });
        expect(res).to.have.status(409);
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "passwordConfirmationDoesNotMatch");
    });

    it("should return 404 if the token is invalid #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "3fe1dbe4-0980-4350-a4a0-56dea5a5d0d5", // this is an token which doesnt exists
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res).to.have.status(404);
    });

    it("should return 404 if the token is expired #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "14268983-7381-462d-9a58-215b1171b922",
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD
        });
        expect(res).to.have.status(404);
    });

    it("should return 409 reject bad passwords #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password/complete").send({
            token: "867a6d89-82fc-471d-bc54-8bff89a4fdfa",
            password: "password1",
            passwordConfirmation: "password1"
        });
        expect(res).to.have.status(409);
        expect(res.body).to.have.all.keys("statusCode", "error", "errorType", "message", "data");
        expect(res.body.data).to.have.all.keys("score", "warning");
        expect(snapshots.prepareSnapshot(res.body)).to.matchSnapshot(SNAPSHOT_FILE, "weakPassword");
    });
});

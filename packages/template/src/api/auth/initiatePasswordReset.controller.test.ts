import { getMoment } from "@aaa-backend-stack/serverdate";
import storage from "@aaa-backend-stack/storage";
import { expect } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("POST /api/v1/auth/forgot-password", () => {

    it("should return 400 for an missing username #noreset", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password").send({});
        expect(res).to.have.status(400);
    });

    it("should return 200 for sending an valid username", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password").send({ username: "user2@test.com" });
        expect(res).to.have.status(200);
        expect(res.body.success).to.equal(true);
    });

    it("should return 200 even tough username was not found (disallow guessing users)", async () => {
        const res = await Request.create("POST", "/api/v1/auth/forgot-password").send({
            username: "notfound.username@test.com"
        });
        expect(res).to.have.status(200);
        expect(res.body.success).to.equal(true);
    });

    it("should return the same token if called 2 times", async () => {

        const res = await Request.create("POST", "/api/v1/auth/forgot-password").send({
            username: "user2@test.com"
        });

        expect(res).to.have.status(200);
        expect(res.body.success).to.equal(true);

        const passwordResetTokenInstance = await storage.models.PasswordResetToken.find({
            where: {
                UserUid: Request.users.user2.uid,
                validUntil: {
                    $gt: getMoment().toDate()
                }
            }
        });

        // tslint:disable-next-line
        expect(passwordResetTokenInstance).to.be.ok;
        const token = passwordResetTokenInstance.token;

        const res2 = await Request.create("POST", "/api/v1/auth/forgot-password").send({
            username: "user2@test.com"
        });

        expect(res2).to.have.status(200);
        expect(res.body.success).to.equal(true);

        const passwordResetTokenInstance2 = await storage.models.PasswordResetToken.find({
            where: {
                UserUid: Request.users.user2.uid,
                validUntil: {
                    $gt: getMoment().toDate()
                }
            }
        });

        expect(passwordResetTokenInstance2.token).to.be.equal(token);
    });

});

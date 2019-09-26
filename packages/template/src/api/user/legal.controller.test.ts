import * as serverdate from "@aaa-backend-stack/serverdate";
import { expect } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("GET /api/v1/user/legal", function () {

    it("should return 200 for current user legal settings #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/user/legal", { user: "user1" });
        expect(res).to.have.status(200);
        expect(res.body.hasGDPROptOut).to.equal(false);
        expect(res.body.legalAcceptedAt).to.equal(null);
    });

});

describe("PATCH /api/v1/user/legal", function () {

    it("should return 200 for patching hasGDPROptOut back and forth", async () => {
        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            hasGDPROptOut: true
        });
        expect(res1).to.have.status(200);
        expect(res1.body.hasGDPROptOut).to.equal(true);
        expect(res1.body.legalAcceptedAt).to.equal(null);

        const res2 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            hasGDPROptOut: false
        });
        expect(res2).to.have.status(200);
        expect(res2.body.hasGDPROptOut).to.equal(false);
        expect(res2.body.legalAcceptedAt).to.equal(null);
    });

    it("should return 200 with unknown childs and null legalAcceptedAt", async () => {
        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            anything: "yep",
            legalAcceptedAt: null
        });
        expect(res1).to.have.status(200);
        expect(res1.body.hasGDPROptOut).to.equal(false);
        expect(res1.body.legalAcceptedAt).to.equal(null);
    });

    it("should return 200 for patching legalAcceptedAt to a valid moment", async () => {

        const mnt = serverdate.getMoment();

        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.toISOString()
        });
        expect(res1).to.have.status(200);
        expect(serverdate.getMoment(res1.body.legalAcceptedAt).diff(mnt)).to.equal(0);
    });

    it("should return 200 for patching legalAcceptedAt to the exact same moment again", async () => {

        const mnt = serverdate.getMoment();

        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.toISOString()
        });
        expect(res1).to.have.status(200);
        expect(serverdate.getMoment(res1.body.legalAcceptedAt).diff(mnt)).to.equal(0);

        const res2 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.toISOString()
        });
        expect(res2).to.have.status(200);
        expect(serverdate.getMoment(res2.body.legalAcceptedAt).diff(mnt)).to.equal(0);
    });

    it("should return 400 for patching legalAcceptedAt back to a smaller one after we have already set it #noreset", async () => {

        const mnt = serverdate.getMoment();

        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.toISOString()
        });
        expect(res1).to.have.status(200);

        const res2 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.clone().subtract(1, "seconds").toISOString()
        });

        expect(res2).to.have.status(400);
        expect(res2.body.errorType).to.equal("LEGAL_ACCEPTED_AT_BEFORE_SAVED");
    });

    it("should return 400 for patching legalAcceptedAt back to null after we have already set it #noreset", async () => {

        const mnt = serverdate.getMoment();

        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.toISOString()
        });
        expect(res1).to.have.status(200);

        const res2 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: null
        });

        expect(res2).to.have.status(400);

        expect(res2.body.errorType).to.equal("LEGAL_ACCEPTED_AT_BACK_TO_NULL_ERROR");
    });

    it("should return 400 for patching legalAcceptedAt to a future too big moment #noreset", async () => {

        const mnt = serverdate.getMoment().add(2, "days");

        const res1 = await Request.create("PATCH", "/api/v1/user/legal", { user: "user1" }).send({
            legalAcceptedAt: mnt.toISOString()
        });
        expect(res1).to.have.status(400);
        expect(res1.body.errorType).to.equal("LEGAL_ACCEPTED_AT_AFTER_MAX");
        // console.log(res1.body);
    });

});

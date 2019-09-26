import { expect } from "@aaa-backend-stack/test-environment";

import CONFIG from "../../configure";
import Request from "../../test/Request";

describe("GET /api/v1/health", function () {
    it("should return 401 on wrong admin secret #noreset", async () => {

        const res = await Request.create("GET", "/api/v1/health").set("X-Admin-Secret", "invalid").send({});
        expect(res).to.have.status(401);
    });

    it("should return 200 when successfully getting health info (via custom X-Admin-Secret header)", async () => {

        const res = await Request.create("GET", "/api/v1/health").set("X-Admin-Secret", CONFIG.routes.monitoringAdminSecret).send({});
        expect(res).to.have.status(200);

        // tslint:disable-next-line
        expect(res.body.databaseWriteableCheck).to.be.true;
        expect(res.body.currentSequenceValue).to.equal(1);
        // tslint:disable-next-line
        expect(res.body.fsWriteableCheck).to.be.true;
    });

    it("should return 200 when successfully getting health info (via auth query param) and increment health sequence", async () => {

        const res = await Request.create("GET", `/api/v1/health?pwd=${CONFIG.routes.monitoringAdminSecret}`);
        expect(res).to.have.status(200);

        // tslint:disable-next-line
        expect(res.body.databaseWriteableCheck).to.be.true;
        expect(res.body.currentSequenceValue).to.equal(1);
        // tslint:disable-next-line
        expect(res.body.fsWriteableCheck).to.be.true;

        // retry, ensure sequence is updated.
        const res2 = await Request.create("GET", `/api/v1/health?pwd=${CONFIG.routes.monitoringAdminSecret}`);
        expect(res2).to.have.status(200);

        // tslint:disable-next-line
        expect(res2.body.databaseWriteableCheck).to.be.true;
        expect(res2.body.currentSequenceValue).to.equal(2); // incremented!
        // tslint:disable-next-line
        expect(res.body.fsWriteableCheck).to.be.true;
    });

});

import { expect } from "@aaa-backend-stack/test-environment";
import Request from "../../test/Request";

describe("GET /assets/{param*}", function () {

    it("should return 200 for normal access on asset #noreset", async function () {
        const res = await Request.create("GET", "/assets/app_content.css", { user: "user1" }).send({});
        expect(res).to.have.status(200);
    });

    it("should return 200 automatically removing a trailing slash #noreset", async function () {
        const res = await Request.create("GET", "/assets/app_content.css/", { user: "user1" }).send({});
        expect(res).to.have.status(200);
    });

    it("should return 404 if file not found #noreset", async function () {
        const res = await Request.create("GET", "/assets/non-found-file.png", { user: "user1" }).send({});
        expect(res).to.have.status(404);
    });

    it("should return 404 if file not found deep #noreset", async function () {
        const res = await Request.create("GET", "/assets/non-available/non-found-file.png", { user: "user1" }).send({});
        expect(res).to.have.status(404);
    });

    it("should return 404 if file not found deep with trailing #noreset", async function () {
        const res = await Request.create("GET", "/assets/non-available/non-found-file.png/", { user: "user1" }).send({});
        expect(res).to.have.status(404);
    });

});

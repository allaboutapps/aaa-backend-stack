import { expect } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("GET /documentation/swagger.json", function () {

    it("should return 200 for requesting swagger.json (basic authentication) #noreset", async () => {
        const res = await Request.create("GET", "/documentation/swagger.json").auth("admin", "d3m0");
        expect(res).to.have.status(200);
    });

    it("should return 200 for requesting swagger documentation page (basic authentication) #noreset", async () => {
        const res = await Request.create("GET", "/documentation").auth("admin", "d3m0");
        expect(res).to.have.status(200);
    });

    it("should return 401 for requesting swagger.json (no authentication) #noreset", async () => {
        const res = await Request.create("GET", "/documentation/swagger.json");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting swagger api documentation (no auth provided) #noreset", async () => {
        const res = await Request.create("GET", "/documentation");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting swagger api documentation (wrong password) #noreset", async () => {
        const res = await Request.create("GET", "/documentation").auth("admin", "wrongPass");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting swagger api documentation (no password) #noreset", async () => {
        const res = await Request.create("GET", "/documentation").auth("admin", "");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting swagger api documentation (no user) #noreset", async () => {
        const res = await Request.create("GET", "/documentation").auth("", "password");
        expect(res).to.have.status(401);
    });

    it("should return 403 for requesting swagger api documentation (user scope only) #noreset", async () => {
        const res = await Request.create("GET", "/documentation").auth("user1@test.com", "password");
        expect(res).to.have.status(403);
    });

});

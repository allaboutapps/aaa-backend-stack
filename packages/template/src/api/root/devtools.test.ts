import { expect } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("GET /devtools", function () {

    it("should return 200 for requesting the devtools endpoint #noreset", async () => {
        const res = await Request.create("GET", "/devtools").auth("admin", "d3m0");
        expect(res).to.have.status(200);
    });

    it("should return 401 for requesting the devtools (no auth provided) #noreset", async () => {
        const res = await Request.create("GET", "/devtools");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting the devtools (wrong password) #noreset", async () => {
        const res = await Request.create("GET", "/devtools").auth("admin", "wrongPass");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting the devtools (no password) #noreset", async () => {
        const res = await Request.create("GET", "/devtools").auth("admin", "");
        expect(res).to.have.status(401);
    });

    it("should return 401 for requesting the devtools (no user) #noreset", async () => {
        const res = await Request.create("GET", "/devtools").auth("", "password");
        expect(res).to.have.status(401);
    });

    it("should return 403 for requesting the devtools (user scope only) #noreset", async () => {
        const res = await Request.create("GET", "/devtools").auth("user1@test.com", "password");
        expect(res).to.have.status(403);
    });

});

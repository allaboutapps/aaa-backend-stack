import { expect } from "@aaa-backend-stack/test-environment";

import Request from "../../test/Request";

describe("GET /api/v1/auth/forgot-password/{token}", () => {
    it("should return password reset form #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/auth/forgot-password/867a6d89-82fc-471d-bc54-8bff89a4fdfa");
        expect(res).to.have.status(200);
        expect(res.type).to.equal("text/html");
    });

    it("should return password reset form for unknown token #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/auth/forgot-password/eb943131-a213-4288-bc26-bcfe2958f766");
        expect(res).to.have.status(200);
        expect(res.type).to.equal("text/html");
    });

    it("should return error for invalid token #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/auth/forgot-password/invalidtoken");
        expect(res).to.have.status(400);
    });
});

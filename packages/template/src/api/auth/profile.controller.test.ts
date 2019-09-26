import { expect } from "@aaa-backend-stack/test-environment";

import CONFIG from "../../configure";
import Request, { users } from "../../test/Request";

describe("GET /api/v1/auth/profile", function () {

    it("should return 200 for an auth/profile call and return username, scope and no password (@authenticated default) #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/auth/profile", { user: "user1" }).send({});
        expect(res).to.have.status(200);
        expect(res.body.profile).to.contain.keys("username", "scope", "uid");
        expect(res.body.profile.scope.length).to.equal(1);
        expect(res.body.profile.scope[0]).to.equal(CONFIG.auth.scope.userScopeIdentifier); // array with scope
        expect(res.body.profile.uid).to.equal(users.user1.uid);
        expect(res.body.profile).to.not.ownProperty("password");
    });

    it("should return 200 for an auth/profile call and return username and no password (@authenticated guest) #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/auth/profile", { user: "guest1" }).send({});
        expect(res).to.have.status(200);
        expect(res.body.profile).to.contain.keys("username", "scope", "uid");
        expect(res.body.profile.scope.length).to.equal(1);
        expect(res.body.profile.scope[0]).to.equal(CONFIG.auth.scope.guestScopeIdentifier); // array with scope
        expect(res.body.profile.uid).to.equal(users.guest1.uid);
        expect(res.body.profile).to.not.ownProperty("password");
    });

    it("should return 200 for an auth/profile call and return username and no password (@authenticated cms) #noreset", async () => {
        const res = await Request.create("GET", "/api/v1/auth/profile", { user: "admin1" }).send({});
        expect(res).to.have.status(200);
        expect(res.body.profile).to.contain.keys("username", "scope", "uid");
        expect(res.body.profile.scope.length).to.equal(1);
        expect(res.body.profile.scope[0]).to.equal("cms"); // array with scope
        expect(res.body.profile.uid).to.equal(users.admin1.uid);
        expect(res.body.profile).to.not.ownProperty("password");
    });

});

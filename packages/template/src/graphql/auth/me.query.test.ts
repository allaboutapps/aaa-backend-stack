import { gqlTestUtils } from "@aaa-backend-stack/graphql";
import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import { admin1 } from "../../test/fixtures";
import * as IGQLQueries from "../../test/IGQLQueries";
import Request, { IResponse } from "../../test/Request";

describe("graphql/WhoAmi", () => {

    it("admin1 scope cms: query me should resolve authenticated user #noreset", async () => {

        const res: IResponse<{ data: IGQLQueries.WhoamiQuery; errors?: any[] }> = await Request.create("POST", "/api/v1/graphql", { user: "admin1" }).send({
            query: gqlTestUtils.getGQLQuery("Whoami")
        });

        expect(res).to.have.status(200);
        expect(res.body).to.matchSnapshot(
            snapshots.getSnapshotFile("Whoami.gql.snap"),
            "admin1"
        );
        expect(res.body.data.me.uid).to.equal(admin1.uid);
        expect(res.body.data.me.username).to.equal("admin1@test.com");
        expect(res.body.data.me.isActive).to.equal(true);
        expect(res.body).not.to.haveOwnProperty("errors");
    });

    it("user1 scope app: should return 403 unauthorized #noreset", async () => {

        const res: IResponse<{ data: IGQLQueries.WhoamiQuery; errors?: any[] }> = await Request.create("POST", "/api/v1/graphql", { user: "user1" }).send({
            query: gqlTestUtils.getGQLQuery("Whoami")
        });

        expect(res).to.have.status(403);

    });

    it("no token: should return 401 #noreset", async () => {

        const res: IResponse<{ data: IGQLQueries.WhoamiQuery; errors?: any[] }> = await Request.create("POST", "/api/v1/graphql").send({
            query: gqlTestUtils.getGQLQuery("Whoami")
        });

        expect(res).to.have.status(401);

    });

});

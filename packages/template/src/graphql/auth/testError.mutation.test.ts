import { gqlTestUtils } from "@aaa-backend-stack/graphql";
import { expect, snapshots } from "@aaa-backend-stack/test-environment";

import * as IGQLQueries from "../../test/IGQLQueries";
import Request, { IResponse } from "../../test/Request";

describe("graphql/testError", () => {

    it("TestErrorMutation throws TEST_ERROR as expected #noreset", async () => {

        // expect error here
        const resError: IResponse<{ data: IGQLQueries.TestErrorMutation; errors?: any[] }> = await Request.create("POST", "/api/v1/graphql", { user: "admin1" }).send({
            query: gqlTestUtils.getGQLQuery("TestError")
        });

        expect(resError).to.have.status(200);
        expect(resError.body).to.haveOwnProperty("errors");
        expect(resError.body.errors[0].name).to.equal("TEST_ERROR");
        expect(snapshots.prepareSnapshot(resError.body)).to.matchSnapshot(
            snapshots.getSnapshotFile("TestError.gql.snap"),
            "TestError"
        );

        // twice!
        const resError2: IResponse<{ data: IGQLQueries.TestErrorMutation; errors?: any[] }> = await Request.create("POST", "/api/v1/graphql", { user: "admin1" }).send({
            query: gqlTestUtils.getGQLQuery("TestError")
        });

        expect(resError2).to.have.status(200);
        expect(snapshots.prepareSnapshot(resError2.body)).to.matchSnapshot(
            snapshots.getSnapshotFile("TestError.gql.snap"),
            "TestError"
        );

    });

});

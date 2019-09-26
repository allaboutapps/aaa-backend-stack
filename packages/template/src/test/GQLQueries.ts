import Request, { IAvailableTestUsers } from "./Request";

export function gqlRequest(query: any, variables = {}, user: IAvailableTestUsers = "admin1") {
    return Request.create("POST", "/cms-api/graphql", { user }).send({
        query,
        variables
    });
}

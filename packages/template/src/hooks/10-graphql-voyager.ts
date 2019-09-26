import * as gqlRestBindings from "@aaa-backend-stack/graphql-rest-bindings";
import * as REST from "@aaa-backend-stack/rest";

import { GRAPHQL_ENDPOINT } from "./10-graphql";

const GRAPHQL_VOYAGER_ENDPOINT = "/documentation/graphql-voyager";

const hook: REST.SERVER.IHook = {

    enabled: true, // Eventually disable this for production environments

    async init(api) {
        await api.registerPlugin({
            register: gqlRestBindings.getGraphQLVoyagerPlugin(),
            options: {
                route: {
                    description: "GraphQL-voyager endpoint (documentation)",
                    tags: ["api", "graphql"],
                    auth: {
                        strategy: "basic-authentication",
                        scope: "root"
                    },
                    ext: {
                        onPreResponse: [{
                            method: gqlRestBindings.injectAccessTokenIntoBrowserEnvironment({
                                browserGlobalTokenVariable: "__TOKEN",
                                objectPathToRequestUserObject: "auth.credentials.user",
                                getNewAccessTokenFn: (user) => {
                                    return user.getNewAccessToken();
                                }
                            })
                        }]
                    }
                },
                path: GRAPHQL_VOYAGER_ENDPOINT,
                endpointUrl: GRAPHQL_ENDPOINT,
                // https://github.com/APIs-guru/graphql-voyager#properties
                displayOptions: {},
                headersJS: "{'Authorization': window.__TOKEN ? 'Bearer ' + window.__TOKEN : ''}" // custom header can be set on the browser console
            }
        });
    }
};

export default hook;

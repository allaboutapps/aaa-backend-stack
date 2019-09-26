import * as gqlRestBindings from "@aaa-backend-stack/graphql-rest-bindings";
import * as REST from "@aaa-backend-stack/rest";

import { GRAPHQL_ENDPOINT } from "./10-graphql";

const GRAPHIQL_ENDPOINT = "/documentation/graphiql";

const hook: REST.SERVER.IHook = {

    enabled: true, // Eventually disable this for production environments

    async init(api) {
        await api.registerPlugin({
            register: gqlRestBindings.getGraphiQLHapiPlugin(),
            options: {
                route: {
                    description: "GraphiQL Endpoint (documentation)",
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
                path: GRAPHIQL_ENDPOINT,
                graphiqlOptions: {
                    endpointURL: GRAPHQL_ENDPOINT,
                    passHeader: "'Authorization': window.__TOKEN ? 'Bearer ' + window.__TOKEN : ''" // custom header can be set on the browser console
                }
            }
        });
    }
};

export default hook;

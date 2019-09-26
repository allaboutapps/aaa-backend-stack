import * as path from "path";

import { GQL, GraphQLSchema, initialize, loadRootSchemaByGlob } from "@aaa-backend-stack/graphql";
import * as gqlRestBindings from "@aaa-backend-stack/graphql-rest-bindings";
import logger from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";
import storage from "@aaa-backend-stack/storage";

import CONFIG from "../configure";
import processGraphQLTypes from "../graphql/types";

export const GRAPHQL_ENDPOINT = "/api/v1/graphql";

// auth to the graphql endpoint will be disabled in the introspection env
const IS_INTROSPECTION_ENVIRONMENT = CONFIG.env === "introspect";

export class Hook implements REST.SERVER.IHook {

    private _graphQLSchema: GQL.GraphQLSchema = null;

    get graphQLSchema(): GraphQLSchema {
        if (!this._graphQLSchema) {
            logger.fatal("hook.graphql.initGraphqlSchema: cannot get graphQLSchema as not initialized properly");
            throw new Error("cannot get graphQLSchema as not initialized properly");
        }

        return this._graphQLSchema;
    }

    async init(api: REST.SERVER.Api) {
        await this.initGraphqlSchema();
        await this.initializeGraphqlEndpoint(api);
    }

    async destroy(api: REST.SERVER.Api) {
        this._graphQLSchema = null;
    }

    async reinitialize(api: REST.SERVER.Api) {
        // its only required to reinitialize the schema
        // the instance graphQLSchema getter will handle propagation of the new connected models to the registered plugins
        await this.initGraphqlSchema();
    }

    getInfo(api: REST.SERVER.Api) {
        return {
            graphql: gqlRestBindings.getSchemaInfo(this.graphQLSchema)
        };
    }

    private async initGraphqlSchema() {

        // properly bind the sequelize context with the graphql binding layer
        initialize(storage.sequelize);

        // translate sequelize models into graphql types...
        const types = processGraphQLTypes(storage.models);

        // All .query. and .mutation. files in ../graphql will be loaded.
        // You just need to default export a (models, types) => GQL.GraphQLFieldConfigMap<...>
        this._graphQLSchema = await loadRootSchemaByGlob({
            cwd: path.resolve(__dirname, "../graphql"),
            models: storage.models,
            types,
            mutationsPattern: "**/*.mutation.@(ts|js)",
            queriesPattern: "**/*.query.@(ts|js)"
        });
    }

    private async initializeGraphqlEndpoint(api: REST.SERVER.Api) {

        await api.registerPlugin({
            register: gqlRestBindings.getGraphQLHapiPlugin(),
            options: {
                route: {
                    description: "GraphQL Endpoint",
                    tags: ["api", "graphql"],
                    // no authentication needed while executing in introspection environment!
                    auth: IS_INTROSPECTION_ENVIRONMENT ? false : {
                        scope: "cms", // only cms scoped users are currently allow to connect to it.
                        strategies: ["default-authentication-strategy"]
                    }
                },
                path: GRAPHQL_ENDPOINT,
                graphqlOptions: async (request: REST.HAPI.Request) => {
                    return Promise.resolve({
                        schema: this.graphQLSchema,
                        context: { // Authorization context gets injected for the graphql schema to use directly
                            credentials: request.auth.credentials
                        },
                        formatError: gqlRestBindings.generateGraphqlRequestErrorHandler(request, {
                            includeServerStackTracesInClientErrors: CONFIG.env !== "production"
                        })
                    });
                }
            }
        });
    }

}

const hook = new Hook();
export default hook;

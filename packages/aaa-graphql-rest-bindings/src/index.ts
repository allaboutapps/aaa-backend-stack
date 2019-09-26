export {
    getSchemaInfo
} from "./getSchemaInfo";

export {
    IIntrospectResponse,
    introspect
} from "./introspect";

export {
    IGenerateTypingsOptions,
    generateTypings
} from "./generateTypings";

export {
    introspectAndGenerate,
    IIntrospectAndGenerateOptions,
    IExtraIntrospectAndGenerateOptions
} from "./introspectAndGenerate";

export {
    generateGraphqlRequestErrorHandler,
    UNHANDLED_SERVER_ERROR
} from "./generateGraphqlRequestErrorHandler";

export {
    IRegister,
    HapiGraphiQLOptionsFunction,
    HapiGraphiQLPluginOptions,
    HapiOptionsFunction,
    HapiPluginOptions
} from "graphql-server-hapi";

export function getGraphQLHapiPlugin() {
    return require("graphql-server-hapi").graphqlHapi;
}

export function getGraphiQLHapiPlugin() {
    return require("graphql-server-hapi").graphiqlHapi;
}

export function getGraphQLVoyagerPlugin() {
    return require("graphql-voyager/middleware").hapi;
}

export * from "./injectAccessTokenIntoBrowserEnvironment";

// export function __TESTS__() {
//     require("./tests");
// }

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "graphql-server-hapi",
    "graphql-voyager"
];

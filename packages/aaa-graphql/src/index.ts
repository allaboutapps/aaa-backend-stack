import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as APOLLO_ERRORS from "apollo-errors";
import gqlTag from "graphql-tag";

// npm lib exports
export { GQL };
export { GQLS };
export { APOLLO_ERRORS };
export { GraphQLSchema, GraphQLError } from "graphql";

export {
    createError,
    formatError as formatApolloError,
    isInstance as isApolloErrorInstance,
    ApolloError,
} from "apollo-errors";

import { ApolloError } from "apollo-errors";
export type IApolloErrorConstructor = new (data?: object) => ApolloError;

export { gqlTag };
export { buildClientSchema, introspectionQuery, printSchema } from "graphql";
export { fromGlobalId, toGlobalId } from "graphql-relay";

export * from "./customGraphQLScalars";
export * from "./buildObjectType";
export * from "./resolveObjectType";
export * from "./resolveListType";
export * from "./resolvePaginatedRelayListType";
export * from "./resolvePaginatedOffsetListType";
export * from "./SequelizeGraphQLObjectType";
export * from "./argUtils";
export * from "./typeUtils";
export * from "./mappers";
export * from "./loadRootSchemaByGlob";
export * from "./internals/relayBindings";
export * from "./internalErrors";
export * from "./gqlContext";

// default public exports
export { default as GQLC } from "./customGraphQLScalars";
export { default as buildObjectType } from "./buildObjectType";
export { default as resolveObjectType } from "./resolveObjectType";
export { default as resolveListType } from "./resolveListType";
export { default as resolvePaginatedRelayListType } from "./resolvePaginatedRelayListType";
export { default as resolvePaginatedOffsetListType } from "./resolvePaginatedOffsetListType";
export { default as SequelizeGraphQLObjectType } from "./SequelizeGraphQLObjectType";

// deprecations
export type IApiRequestContext = any; // was deprecated, 

// tests
import * as testUtilsNamespace from "./testUtils";
export { testUtilsNamespace as gqlTestUtils };

// export function __TESTS__() {
//     require("./tests");
// }

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/graphql",
    "@types/graphql-relay",
    // "@playlyfe/gql", // gql visual studio code tools, will not be actually required by projects
    "apollo-codegen",
    "apollo-errors",
    // "codemirror", // gql visual studio code tools, will not be actually required by projects
    "dataloader-sequelize", // also owned by storage, same version must be used!
    "graphql",
    "graphql-sequelize",
    "graphql-tag",
    "graphql-relay"
];

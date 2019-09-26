import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as GQL from "graphql";
import * as Sequelize from "sequelize";
import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";
import { TRAVERSE, GLOB_PROMISE } from "@aaa-backend-stack/utils";
import * as path from "path";
import * as _ from "lodash";

export type ISpecModels = object;

export interface ISpecTypes {
    [name: string]: SequelizeGraphQLObjectType<Sequelize.Instance<any>>;
}

export interface ILoadSchemaByGlobOptions {
    queriesPattern: string;
    mutationsPattern: string;
    cwd: string;
    models: Partial<ISpecModels>;
    types: ISpecTypes;
}

export async function loadRootSchemaByGlob({ queriesPattern, mutationsPattern, cwd, models, types }: ILoadSchemaByGlobOptions): Promise<GQL.GraphQLSchema> {
    const [queryFiles, mutationFiles] = await Promise.all([
        GLOB_PROMISE(queriesPattern, { cwd }),
        GLOB_PROMISE(mutationsPattern, { cwd })
    ]);

    logger.debug({
        queryFiles,
        queriesPattern,
        mutationFiles,
        mutationsPattern,
        cwd
    }, "loadRootSchemaByGlob: will require these queries and mutations...");

    const queryFieldConfig = _.reduce(queryFiles, (sum, queryFile) => {

        const queryPath = path.resolve(cwd, queryFile);

        logger.trace({
            queryPath
        }, "loadRootSchemaByGlob: requiring query...");

        const query = require(queryPath);

        const definition = parseGraphQLFieldConfigMapFunctionDefinition({
            models,
            types,
            requiredFile: query,
            path: queryPath
        });

        if (definition) {
            return {
                ...sum,
                ...definition
            };
        }

        return sum;
    }, {});

    // Headsup: GraphQL does not allow root-schemas without a single defined query field
    if (_.keys(queryFieldConfig).length === 0) {

        logger.fatal({
            queryFieldConfig,
            queriesPattern,
            mutationsPattern,
            cwd,
            models,
            types,
            queryFiles
        }, "You must at least specify ONE single valid GraphQL query, it's impossible to setup an empty GraphQL scheme!");

        throw new Error("You must at least specify ONE single valid GraphQL query, it's impossible to setup an empty GraphQL scheme!");
    }

    // However schemas without mutations are valid and allowed.
    const mutationFieldConfig = _.reduce(mutationFiles, (sum, mutationFile) => {

        const mutationPath = path.resolve(cwd, mutationFile);

        logger.trace({
            mutationPath
        }, "loadRootSchemaByGlob: requiring query...");

        const mutation = require(mutationPath);

        const definition = parseGraphQLFieldConfigMapFunctionDefinition({
            models,
            types,
            requiredFile: mutation,
            path: mutationPath
        });

        if (definition) {
            return {
                ...sum,
                ...definition
            };
        }

        return sum;
    }, {});

    return new GQL.GraphQLSchema({
        // A root schema without a mutation is valid but must be explicitly handled through >null<!
        mutation: _.keys(queryFieldConfig).length === 0 ? null : new GQL.GraphQLObjectType({
            name: "Mutation",
            description: `This special 'Mutation' node wraps all available mutations this service provides (ways to mutate data).`,
            fields: mutationFieldConfig
        }),
        query: new GQL.GraphQLObjectType({
            name: "RootQueryType",
            description: `This special 'RootQueryType' node wraps all available queries this service provides (ways to get data).`,
            fields: queryFieldConfig
        })
    });
}

interface IGraphQLFieldFileDef {
    path: string;
    requiredFile: {
        default: (models: ISpecModels, types: ISpecTypes) => GQL.GraphQLFieldConfigMap<any, any>;
    };
    models: ISpecModels;
    types: ISpecTypes;
}

function parseGraphQLFieldConfigMapFunctionDefinition(spec: IGraphQLFieldFileDef): GQL.GraphQLFieldConfigMap<any, any> {

    if (_.isFunction(spec.requiredFile.default)) {

        const processed = spec.requiredFile.default(spec.models, spec.types);

        if (_.isObject(processed)) {
            return processed;
        }
    }

    console.warn(`@aaa-backend-stack/graphql.loadRootSchemaByGlob: ${spec.path} did not produce a valid GraphQLFieldConfigMap, ignored...`);

    return null;
}

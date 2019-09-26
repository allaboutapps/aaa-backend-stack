import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as Sequelize from "sequelize";
import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as _ from "lodash";

import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";
import { IExtendedResolverOptions } from "./resolveObjectType";
import * as mappers from "./mappers";

export interface IExtendedResolverListOptions extends IExtendedResolverOptions {
    orderBy: GQL.GraphQLEnumType; // order mapping can be directly supplied.
    injectDefaultOrderByIfAvailable: boolean; // defaults to true (if defined on the object)
}

// A default sequelize list builder without any pagination or querying requirement (but sortable)
export default function resolveListType<I extends Sequelize.Instance<A>, A>(
    graphQLTarget: SequelizeGraphQLObjectType<I>,
    model: Sequelize.Model<I, A>,
    associationFn: Sequelize.Model<I, A> | void,
    resolverOptions: Partial<IExtendedResolverListOptions> = {}
): GQL.GraphQLFieldConfig<any, any> {

    const modelName = mappers.getName(model);
    const plural = mappers.getPlural(modelName);
    logger.trace(`graphql.resolveListType: ${modelName} plural: ${plural}`);

    const defaultArgs = resolverOptions.defaultArgs === false ? {} : mappers.defaultArgs(model);
    const orderArgs = resolverOptions.orderBy ? {
        orderBy: {
            type: resolverOptions.orderBy,
            // inject a default value or orderings...
            ...(resolverOptions.orderBy.getValues().length > 0 ? { defaultValue: resolverOptions.orderBy.getValues()[0].value } : {})
        }
    } : {
            ...((resolverOptions.injectDefaultOrderByIfAvailable !== false && graphQLTarget.defaultOrderBy !== null) ? {
                orderBy: {
                    type: graphQLTarget.defaultOrderBy,
                    // inject a default value or orderings...
                    ...(graphQLTarget.defaultOrderBy.getValues().length > 0 ? { defaultValue: graphQLTarget.defaultOrderBy.getValues()[0].value } : {})
                }
            } : {})
        };

    return {
        description: `Resolves a list of ${plural} .`,
        type: new GQL.GraphQLList(graphQLTarget),
        resolve: GQLS.resolver(associationFn as Sequelize.Model<I, A>, {
            ...resolverOptions,
            before: async (options: mappers.IBeforeOptions, args: object, context: any, info: GQL.GraphQLResolveInfo) => {

                const parsedOptions = await mappers.parseBeforeHandler(graphQLTarget, resolverOptions, options, args, context, info, true);

                logger.trace({
                    parsedOptions,
                    args
                }, `graphql.resolveListType.before: ${modelName}`);

                return parsedOptions;
            },
            after: async (result: I[], args: object, context: any, info: GQL.GraphQLResolveInfo) => {
                const internalResults = result;

                // apply specialized after handler from outside...
                const appliedResults: I[] = resolverOptions.after ?
                    await Promise.resolve<I[]>(resolverOptions.after(internalResults, args, context, info)) :
                    internalResults;

                // finally apply authorization after handler from SequelizeGraphQLObjectType definition
                // (mapped as result is an array!).
                const finalResult = await Promise.map(appliedResults, (appliedResult) => {
                    return graphQLTarget.after<I>(appliedResult, args, context, info);
                });

                logger.trace({
                    finalResult
                }, `graphql.resolveListType.after: ${modelName}`);

                return finalResult;
            }
        } as any), // unfortuately the tpyings do not match up 100%
        args: {
            ...defaultArgs,
            ...orderArgs,
            ...(graphQLTarget.defaultWhereMap ? graphQLTarget.defaultWhereMap : {}),
            ...resolverOptions.whereMap
        }
    };
}

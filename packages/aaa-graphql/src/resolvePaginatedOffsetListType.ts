import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as Sequelize from "sequelize";
import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as _ from "lodash";

import * as mappers from "./mappers";
import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";
import resolveListType, { IExtendedResolverListOptions } from "./resolveListType";

export interface IExtendedResolverPaginatedOffsetListOptions extends IExtendedResolverListOptions {
    name: string; // custom offset list name (identifier)

    // distinct count for paging (preserving includes) is enabled by default
    // see https://github.com/sequelize/sequelize/issues/2713
    countRootDistinct?: boolean; // if we should count distinct (supporting include within count). Defaults to true
    countAssociatedDistinct?: boolean; // if we should count associated models in distinct mode (use resolver is used from another model resolver). Defaults to true

    // pagination defaults
    defaultNodesLimit?: number; // integer, defaults to DEFAULT_NODES_LIMIT
    maxNodesLimit?: number; // integer, defaults to MAX_NODES_LIMIT
    defaultNodesOffset?: number; // integer, defaults to DEFAULT_NODES_OFFSET
}

const DEFAULT_NODES_LIMIT = 20;
const MAX_NODES_LIMIT = 100;
const DEFAULT_NODES_OFFSET = 0;

// based on https://github.com/mickhansen/graphql-sequelize/blob/master/src/defaultListArgs.js
// however no custom where operator is returned and no direct ordering is allowed!
// supported order params must be defined by an orderBy map in the list resolver.
function getPaginatedOffsetListArgs(defaultNodesLimit = DEFAULT_NODES_LIMIT, maxNodesLimit = MAX_NODES_LIMIT, defaultNodesOffset = DEFAULT_NODES_OFFSET): GQL.GraphQLFieldConfigArgumentMap {
    return {
        limit: {
            type: GQL.GraphQLInt,
            description: `The limit to apply, default is ${defaultNodesLimit}. Only positive values are allowed. Max is ${maxNodesLimit}.`,
            defaultValue: defaultNodesLimit
        },
        offset: {
            type: GQL.GraphQLInt,
            description: `The offset to apply, default is ${defaultNodesOffset}. Only positive values are allowed. Min is 0.`,
            defaultValue: defaultNodesOffset
        }
    };
}

export default function resolvePaginatedOffsetListType<I extends Sequelize.Instance<A>, A>(
    graphQLTarget: SequelizeGraphQLObjectType<I>,
    model: Sequelize.Model<I, A>,
    associationFn: Sequelize.Model<I, A> | void,
    resolverOptions: Partial<IExtendedResolverPaginatedOffsetListOptions> = {}
): GQL.GraphQLFieldConfig<any, any> {

    // construct a unique type id for use of this new type...
    const { identifier, name, plural, resolveDescription } = mappers.getListConnectionIdentifier(model, associationFn, "offset", resolverOptions.name);

    logger.trace(`graphql.resolvePaginatedOffsetListType: ${name} plural: ${plural} identifier: ${identifier}`);

    const defaultArgs = resolverOptions.defaultArgs === false ? {} : mappers.defaultArgs(model);

    const { defaultNodesLimit, maxNodesLimit, defaultNodesOffset } = resolverOptions;

    const appliedDefaultNodesLimit = _.isFinite(defaultNodesLimit) ? defaultNodesLimit : DEFAULT_NODES_LIMIT;
    const appliedMaxNodesLimit = _.isFinite(maxNodesLimit) ? maxNodesLimit : MAX_NODES_LIMIT;
    const appliedDefaultNodesOffset = _.isFinite(defaultNodesOffset) ? defaultNodesOffset : DEFAULT_NODES_OFFSET;

    const defaultOffsetListArgs = getPaginatedOffsetListArgs(
        appliedDefaultNodesLimit,
        appliedMaxNodesLimit,
        appliedDefaultNodesOffset
    );

    const orderArgs = resolverOptions.orderBy ? {
        orderBy: {
            type: resolverOptions.orderBy,
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

    const listType = resolveListType(graphQLTarget, model, associationFn, resolverOptions);

    return {
        description: `Resolves an offset paginated list of ${plural}.\n\nPerfectly suited for displaying paged tabular data.\n\n${resolveDescription}.`,
        type: new GQL.GraphQLObjectType({
            name: identifier,
            description: `An offset based paginated list for ${plural}`,
            fields: () => ({
                nodes: {
                    type: listType.type,
                    resolve: ({ source, args, ...passthroughOptions }, { }, context, info) => {
                        return listType.resolve!(source, args, context, info);
                    }
                },
                totalCount: {
                    description: `The total count of ${plural} instances in the whole list (can be used for offset based paging)`,
                    type: new GQL.GraphQLNonNull(GQL.GraphQLInt),
                    resolve: async ({ source, args, ...passthroughOptions }, { }, context, info) => {

                        // as we are using default args and are not within the nodes context
                        // we also must map the primary key attribute to where if it's set!
                        const primaryKey = (model as any).primaryKeyAttribute;
                        const defaultPrimaryKeyArgToWhere = _.isUndefined(args[primaryKey]) === false ? {
                            [primaryKey]: args[primaryKey]
                        } : {};

                        // both gqlTarget.before and resolverOptions.before must be applied!
                        const parsedOptions = await mappers.parseBeforeHandler(graphQLTarget, resolverOptions, { source, args, ...passthroughOptions }, args, context, info);

                        logger.trace({
                            parsedOptions,
                            args
                        }, `graphql.resolvePaginatedOffsetListType.totalCount (parseBeforeHandler): ${name}`);

                        const where = {
                            ...defaultPrimaryKeyArgToWhere,
                            ...parsedOptions.where
                            // ...mappers.mapGraphQLArgsToSequelizeWhere(args, resolverOptions, graphQLTarget)
                        };

                        // logger.fatal({ where, source, args, passthroughOptions, context, info }, "COUNT!");

                        const include = parsedOptions.include;

                        if (source) {

                            if (source["count" + plural]) {

                                logger.trace({
                                    where,
                                    include
                                }, `graphql.resolvePaginatedOffsetListType.totalCount: ${name} (through ${"count" + plural}) identifier: ${identifier}`);

                                // call countAssociations on the source
                                return source["count" + plural]({
                                    where,
                                    include,
                                    // enable distinct count by default if an include is currently specified.
                                    distinct: resolverOptions.countAssociatedDistinct !== false && include && include.length > 0
                                });
                            }

                            logger.fatal({
                                source,
                                args,
                                where,
                            }, `graphql.resolvePaginatedOffsetListType.totalCount: Failed to find ${"count" + plural} function on source  identifier: ${identifier}`);

                            throw new GQL.GraphQLError(`Internal error: Failed to find ${"count" + plural} function on source identifier: ${identifier}`);

                        }

                        logger.trace({
                            where,
                            include
                        }, `graphql.resolvePaginatedOffsetListType.totalCount: ${name} (through global) identifier: ${identifier}`);

                        // global count
                        return model.count({
                            where,
                            include,
                            // enable distinct count by default if an include is currently specified.
                            distinct: resolverOptions.countRootDistinct !== false && include && include.length > 0
                        });

                    }
                },
                offset: {
                    type: new GQL.GraphQLNonNull(GQL.GraphQLInt),
                    description: `Returns the actual applied offset, default is ${appliedDefaultNodesOffset}`,
                    resolve: ({ options, args, ...passthroughOptions }, { }, context, info) => {
                        return args.offset;
                    }
                },
                limit: {
                    type: new GQL.GraphQLNonNull(GQL.GraphQLInt),
                    description: `Returns the actual applied limit, default is ${appliedDefaultNodesLimit}. Max is ${appliedMaxNodesLimit}`,
                    resolve: ({ options, args, ...passthroughOptions }, { }, context, info) => {
                        return args.limit;
                    }
                }
            })
        }),
        args: {
            ...defaultArgs,
            ...defaultOffsetListArgs,
            ...orderArgs,
            ...(graphQLTarget.defaultWhereMap ? graphQLTarget.defaultWhereMap : {}),
            ...resolverOptions.whereMap
        },
        resolve: (options, args: any, context, info) => {
            const $resolver: any = function (source: GQL.Source) {
                return source;
            };

            const defaultedOffset = (args.offset || appliedDefaultNodesOffset);
            const appliedOffset = defaultedOffset < 0 ? 0 : defaultedOffset;

            const defaultedLimit = (args.limit || appliedDefaultNodesLimit);
            const appliedLimit = defaultedLimit > appliedMaxNodesLimit ? appliedMaxNodesLimit : defaultedLimit;

            // internal handling to passthrough to child resolvers
            $resolver.$passthrough = true;
            $resolver.source = options;
            $resolver.args = {
                ...args,
                offset: appliedOffset,
                limit: appliedLimit
            };

            return $resolver;
        }
    };
}

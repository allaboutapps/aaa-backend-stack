import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as Sequelize from "sequelize";
import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as _ from "lodash";

import * as mappers from "./mappers";
import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";

export interface IPaginatedListTypeOptions {
    whereMap: mappers.IWhereMap;
    orderBy: GQL.GraphQLEnumType;
    before: GQLS.IBeforeFn<any>;
    after: GQLS.IAfterFn<any>;
    connectionFields: GQL.GraphQLFieldConfigMap<any, any>;
    edgeFields: GQL.GraphQLFieldConfigMap<any, any>;
    name: string; // custom relay connection identifier
    injectDefaultOrderByIfAvailable: boolean; // defaults to true.

    // distinct count for paging (preserving includes) is enabled by default
    // see https://github.com/sequelize/sequelize/issues/2713
    countRootDistinct?: boolean; // if we should count distinct (supporting include within count). Defaults to true
    countAssociatedDistinct?: boolean; // if we should count associated models in distinct mode (use resolver is used from another model resolver). Defaults to true
}

export interface IPaginatedEdge<I extends Sequelize.Instance<any>> {
    cursor: any;
    node: I;
    source: any;
}

export interface IPaginatedAfterResult<I extends Sequelize.Instance<any>> {
    args: any;
    edges?: IPaginatedEdge<I>[];
    pageInfo: any;
    source: any;
    where: any;
}

export interface ISequelizeConnectionGraphQLFieldConfig extends GQL.GraphQLFieldConfig<any, any> {
    sequelizeConnection: GQLS.ISequelizeConnectionReturn;
}

// complies to Relay Cursor Connections Specification
// see https://facebook.github.io/relay/graphql/connections.htm
export default function resolvePaginatedRelayListType<I extends Sequelize.Instance<A>, A>(
    graphQLTarget: SequelizeGraphQLObjectType<I>,
    model: Sequelize.Model<I, A>,
    associationFn: Sequelize.Model<I, A> | void,
    resolverOptions: Partial<IPaginatedListTypeOptions> = {}
): ISequelizeConnectionGraphQLFieldConfig {

    // construct a unique type id for use of this new type...
    const { identifier, name, plural, resolveDescription } = mappers.getListConnectionIdentifier(model, associationFn, "relay", resolverOptions.name);

    logger.trace(`graphql.resolvePaginatedRelayListType: ${name} plural: ${plural} identifier: ${identifier}`);

    const whereMap = {
        ...(graphQLTarget.defaultWhereMap ? graphQLTarget.defaultWhereMap : {}),
        ...(resolverOptions.whereMap ? resolverOptions.whereMap : {})
    };

    const PaginatedListType = GQLS.relay.sequelizeConnection({
        name: identifier,
        nodeType: graphQLTarget,
        target: associationFn ? associationFn : model,
        orderBy: resolverOptions.orderBy ? resolverOptions.orderBy : (
            graphQLTarget.defaultOrderBy !== null && resolverOptions.injectDefaultOrderByIfAvailable !== false ? graphQLTarget.defaultOrderBy : undefined
        ),
        where: (key: string, value: any, previousWhere: object) => {

            if (whereMap[key] && whereMap[key].where) {
                return whereMap[key].where(value, previousWhere);
            }

            logger.fatal({
                key,
                value,
                name,
                plural,
                whereMap
            }, `graphql.resolvePaginatedRelayListType.where Query error: Invalid argument key to where transformation. key ${key} not found identifier: ${identifier}`);

            throw new GQL.GraphQLError(`Query error: Invalid argument key to where transformation. key ${key} not found identifier: ${identifier}`);
        },
        connectionFields: {
            // automatically attach totalCount connectionField helper to all PaginatedLists
            // must be attached to all relay compliant pagination endpoints, see http://graphql.org/learn/pagination/#complete-connection-model
            // TODO: can go away after https://github.com/mickhansen/graphql-sequelize/issues/417 lands
            totalCount: {
                type: new GQL.GraphQLNonNull(GQL.GraphQLInt),
                resolve: ({ source, args, where, ...other }, { }, context, info) => {

                    const include = mappers.mapGraphQLArgsToSequelizeInclude(args, resolverOptions, graphQLTarget);

                    if (source) {

                        if (source["count" + plural]) {

                            logger.trace({
                                where,
                                include
                            }, `graphql.resolvePaginatedRelayListType.totalCount: ${name} (through ${"count" + plural}) identifier: ${identifier}`);

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
                            other
                        }, `graphql.resolvePaginatedRelayListType.totalCount: Failed to find ${"count" + plural} function on source identifier: ${identifier}`);

                        throw new GQL.GraphQLError(`Internal error: Failed to find ${"count" + plural} function on source identifier: ${identifier}`);

                    }

                    logger.trace({
                        where,
                        include
                    }, `graphql.resolvePaginatedRelayListType.totalCount: ${name} (through global) identifier: ${identifier}`);

                    // global count
                    return model.count({
                        where,
                        include,
                        // enable distinct count by default if an include is currently specified.
                        distinct: resolverOptions.countRootDistinct !== false && include && include.length > 0
                    });
                }
            },
            // allow to append additional connectionFields from the outside...
            ...resolverOptions.connectionFields
        },
        edgeFields: {
            // allow to append additional edgeFields from the outside...
            ...resolverOptions.edgeFields
        },
        before: async (options: mappers.IBeforeOptions, args: object, context: any, info: GQL.GraphQLResolveInfo) => {

            const internalOptions = options;

            // attention: no need to apply where options, this is automatically done via the outside pagination handler!
            // join include from outside with standard resolved includes from the query...
            internalOptions.include = _.union(options.include, mappers.mapGraphQLArgsToSequelizeInclude(args, resolverOptions, graphQLTarget));

            // apply specialized before handler from outside...
            const appliedOptions = resolverOptions.before ?
                await Promise.resolve<mappers.IBeforeOptions>(resolverOptions.before(internalOptions, args, context, info)) :
                internalOptions;

            // finally apply authorization before handler from SequelizeGraphQLObjectType definition.
            const finalOptions = await Promise.resolve<mappers.IBeforeOptions>(graphQLTarget.before(appliedOptions, args, context, info));

            logger.trace({
                args,
                options
            }, `graphql.resolvePaginatedRelayListType.before: ${name} identifier: ${identifier}`);

            return finalOptions;
        },
        after: async (result: IPaginatedAfterResult<I>, args: object, context: any, info: GQL.GraphQLResolveInfo) => {
            const internalResults: IPaginatedAfterResult<I> = result;

            // apply specialized after handler from outside...
            const finalResult: IPaginatedAfterResult<I> = resolverOptions.after ?
                await Promise.resolve<IPaginatedAfterResult<I>>(resolverOptions.after(internalResults, args, context, info)) :
                internalResults;

            // finally apply authorization after handler from SequelizeGraphQLObjectType definition
            // we must perform this map directly on the edges[].node result (if available...)!
            if (finalResult.edges && _.isEmpty(finalResult.edges) === false) {
                finalResult.edges = await Promise.map(finalResult.edges, async (edge) => {
                    if (edge.node) {
                        return {
                            ...edge,
                            node: await Promise.resolve<I>(graphQLTarget.after(edge.node, args, context, info))
                        } as IPaginatedEdge<I>;
                    }
                    return edge;
                });
            }

            logger.trace({
                finalResult
            }, `graphql.resolvePaginatedRelayListType.after: ${name} identifier: ${identifier}`);

            return finalResult;
        },
    } as any);

    // return the whole fieldConnection ready to use
    // decorate connectionArgs with the received where map
    // the whole sequelizeConnection is available at the special injectedProperty
    return {
        description: `Resolves an cursor paginated list of ${plural}.\n\nPerfectly suited for infinite scrolling lists.\n\n${resolveDescription}.`,
        type: PaginatedListType.connectionType,
        resolve: PaginatedListType.resolve,
        args: {
            ...PaginatedListType.connectionArgs,
            ...whereMap,
        },
        sequelizeConnection: PaginatedListType
    };
}

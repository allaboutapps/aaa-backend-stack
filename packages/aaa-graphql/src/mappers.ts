import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as util from "util";
import * as Sequelize from "sequelize";
import * as _ from "lodash";
import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";

import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";
import { IExtendedResolverOptions } from "./resolveObjectType";
import { IExtendedResolverListOptions } from "./resolveListType";
import * as gqlContext from "./gqlContext";

export type IWhereOptions = object; // TODO: better typings for resolved where conditions are needed.
export type IWhereFn = (value: any, previousWhere: IWhereOptions) => IWhereOptions;

export type IIncludeOptions = Sequelize.IncludeOptions[];

export type IIncludeFnDeprecated = (previousInclude: IIncludeOptions) => IIncludeOptions;
export type IIncludeFnModern = (value: any, previousInclude: IIncludeOptions) => IIncludeOptions;

// union type of the above, the new syntax for fn innovocation complys to the same scheme as the IWhereFn
export type IIncludeFn = IIncludeFnDeprecated | IIncludeFnModern;

// [sic!] order arguments supported by Sequelize, copied directly from their typings (current limited to the use of arrays only)...
export type ISequelizeOrder = Array<string | number | Sequelize.Model<any, any> | { model: Sequelize.Model<any, any>, as?: string }> |
    Array<string | Sequelize.col | Sequelize.literal | Array<string | number | Sequelize.Model<any, any> | { model: Sequelize.Model<any, any>, as?: string }>>;

export interface IWhereFieldConfigMap extends GQL.GraphQLArgumentConfig {
    where: IWhereFn;
    include?: IIncludeFn;
}

export interface IWhereMap { // defines translation from Graphql args to sequelize where
    [fieldName: string]: IWhereFieldConfigMap;
}

export interface IBeforeOptions {
    where: IWhereOptions;
    include: IIncludeOptions;
    order: ISequelizeOrder[];
}

export function getName(model: Sequelize.Model<any, any>): string {
    // Do NOT use: return `${util.inspect(model)}`; -> according to node docs util.inspect() result
    // can change anytime. You should not rely on it.

    // This takes model.toString() which returns [object SequelizeModel:User] and extracts "User" to
    // stay compatible with current code base
    return model.toString().match(/(?<=\:)(.*?)(?=\])/g)[0];
}

export function getDescription(model: Sequelize.Model<any, any>): string {
    return `A ${getName(model)} instance`;
}

export function getPlural(modelName: string): string {
    return Sequelize.Utils.pluralize(modelName);
}

// based on https://github.com/mickhansen/graphql-sequelize/blob/master/src/defaultArgs.js
// however no custom where operator is returned
export function defaultArgs<I extends Sequelize.Instance<A>, A>(model: Sequelize.Model<I, A>): GQL.GraphQLFieldConfigArgumentMap {
    let result: GQL.GraphQLFieldConfigArgumentMap = {};
    const key = (model as any).primaryKeyAttribute;
    const attribute = (model as any).rawAttributes[key];
    let type: GQL.GraphQLScalarType;

    if (key && attribute) {
        type = GQLS.typeMapper.toGraphQL(attribute.type, (model as any).sequelize.constructor);
        result = {
            [key]: {
                type
            }
        };
    }

    return result;
}

export function mapGraphQLArgsToSequelizeWhere<TInstance extends Sequelize.Instance<any>>(args: object, resolverOptions: Partial<IExtendedResolverOptions>, graphQLTarget: SequelizeGraphQLObjectType<TInstance>): IWhereOptions {
    // transform args to where through whereMap...
    let where: IWhereOptions = {};

    if (_.isObject(resolverOptions.whereMap) === false && _.isObject(graphQLTarget.defaultWhereMap) === false) {
        return where; // bailout, no need to parse
    }

    _.forOwn(args, (value, key: string) => {
        // check if arg was found in whereMap, if the case transform it back.
        let whereFragment;

        if (resolverOptions.whereMap && resolverOptions.whereMap[key]) {
            whereFragment = resolverOptions.whereMap[key].where(value, where); // where property --> previousWhere
        } else if (graphQLTarget.defaultWhereMap && graphQLTarget.defaultWhereMap[key]) {
            whereFragment = graphQLTarget.defaultWhereMap[key].where(value, where); // where property --> previousWhere
        }

        if (whereFragment) {
            where = {
                ...where,
                ...whereFragment
            };
        }

    });

    return where;
}

export function mapGraphQLArgsToSequelizeInclude<TInstance extends Sequelize.Instance<any>>(args: object, resolverOptions: Partial<IExtendedResolverOptions>, graphQLTarget: SequelizeGraphQLObjectType<TInstance>): IIncludeOptions {
    let include: IIncludeOptions = [];

    if (_.isObject(resolverOptions.whereMap) === false && _.isObject(graphQLTarget.defaultWhereMap) === false) {
        return include; // bailout, no need to parse
    }

    // TODO: eventuelly change the include syntax and explicitly pass the duplicate include statement as the previousInclude argument
    // attention: hard dependency on conditionalInclude helper function

    // use the explicit includes from the resolverOptionWhereMap first, then the defaultWhereMap!
    // whereMap...
    _.forOwn(args, (value, key: string) => {
        // check if arg was found in whereMap, if the case transform it back.
        if (resolverOptions.whereMap && resolverOptions.whereMap[key] && resolverOptions.whereMap[key].include) {

            // still support deprecated include syntax:
            // include(previousInclude) and include(value, previousInclude) must be supported!
            if (resolverOptions.whereMap[key].include.length <= 1) {
                // include(previousInclude) fn innovocation
                const fn = <IIncludeFnDeprecated>resolverOptions.whereMap[key].include!;
                include = _.union(include, fn(include));
                console.warn(`[DEPRECATED]: graphql arg ${key} for model type ${graphQLTarget.name}.whereMap: include(previousInclude?) => [includes] is deprecated. Please migrate to include(value, previousInclude) => [includes] instead.`);
            } else {
                // include(previousInclude, value) fn innovocation
                const fn = <IIncludeFnModern>resolverOptions.whereMap[key].include!;
                include = _.union(include, fn(value, include));
            }
        }
    });

    // defaultWhereMap...
    _.forOwn(args, (value, key: string) => {
        // check if arg was found in whereMap, if the case transform it back.
        if (graphQLTarget.defaultWhereMap && graphQLTarget.defaultWhereMap[key] && graphQLTarget.defaultWhereMap[key].include) {

            // still support deprecated include syntax:
            // include(previousInclude) and include(value, previousInclude) must be supported!
            if (graphQLTarget.defaultWhereMap[key].include.length <= 1) {
                // include(previousInclude) fn innovocation
                const fn = <IIncludeFnDeprecated>graphQLTarget.defaultWhereMap[key].include!;
                include = _.union(include, fn(include));
                console.warn(`[DEPRECATED]: graphql arg ${key} for model type ${graphQLTarget.name}.defaultWhereMap: include(previousInclude?) => [includes] is deprecated. Please migrate to include(value, previousInclude) => [includes] instead.`);
            } else {
                // include(previousInclude, value) fn innovocation
                const fn = <IIncludeFnModern>graphQLTarget.defaultWhereMap[key].include!;
                include = _.union(include, fn(value, include));
            }
        }
    });

    // now make sure the include chain stays unique (defaultWhereMap includes are overwritten by whereMap includes, as they come afterwards)...
    const uniqueInclude = _.uniqBy(include, "model");

    if (uniqueInclude.length !== include.length) {
        logger.error({
            resolverOptions,
            graphQLTarget,
            uniqueInclude,
            include,
            originalLength: include.length,
            uniqueLength: uniqueInclude.length
        }, "mapGraphQLArgsToSequelizeInclude (silent): include arrays were forcefully combined (we sure to use (previousInclude) => include to solve potential problems when merging multiple includes (or use soft-includes through conditionalInclude(previousInclude, newInclude)))!");
    }

    return uniqueInclude;
}

export function mapGraphQLOrderByEnumToSequelizeOrder<TInstance extends Sequelize.Instance<any>>(args: { orderBy?: any }, resolverOptions: Partial<IExtendedResolverListOptions>, graphQLTarget: SequelizeGraphQLObjectType<TInstance>): ISequelizeOrder | undefined {
    if (!args.orderBy) {
        if (resolverOptions.orderBy) {
            // orderBy is defined, use the first argument as the order value.
            // gql internal used syntax, see https://github.com/mickhansen/graphql-sequelize/blob/master/src/relay.js#L222
            const order = (resolverOptions.orderBy as any)._values[0].value;
            logger.trace({
                order,
                args,
                graphQLTarget: graphQLTarget.name
            }, "graphql.mappers.mapGraphQLOrderByEnumToSequelizeOrder: mapping args to resolverOptions.orderBy");
            return order;
        } else if (graphQLTarget.defaultOrderBy && resolverOptions.injectDefaultOrderByIfAvailable !== false) {
            const order = (graphQLTarget.defaultOrderBy as any)._values[0].value;
            logger.trace({
                order,
                args,
                graphQLTarget: graphQLTarget.name
            }, "graphql.mappers.mapGraphQLOrderByEnumToSequelizeOrder: mapping args to graphQLTarget.defaultOrderBy");
            return order;
        }
        // no orderBy arg received and no orderBy specified,
        // no default ordering to apply (primary key ordering will potentially be automatically applied)
        return undefined;
    }

    // orderBy is available and it's definately a valid specfied one
    // return the defined order for this enum value!
    return args.orderBy;
}

export async function parseBeforeHandler<TInstance extends Sequelize.Instance<any>>(graphQLTarget: SequelizeGraphQLObjectType<TInstance>, resolverOptions: Partial<IExtendedResolverOptions>, options: IBeforeOptions, args: object, context: any, info: GQL.GraphQLResolveInfo, mapOrderBy = false): Promise<IBeforeOptions> {
    const internalOptions = options;

    // map where options from args
    internalOptions.where = {
        ...options.where,
        ...mapGraphQLArgsToSequelizeWhere(args, resolverOptions, graphQLTarget)
    };

    // join include from outside with standard resolved includes from the query...
    internalOptions.include = _.union(options.include, mapGraphQLArgsToSequelizeInclude(args, resolverOptions, graphQLTarget));

    if (mapOrderBy === true) {

        if (_.isArray(internalOptions.order) === false) {
            internalOptions.order = [];
        }

        const mappedOrder = mapGraphQLOrderByEnumToSequelizeOrder(args, resolverOptions, graphQLTarget);

        if (mappedOrder) {
            internalOptions.order.push(mappedOrder);
        }

    }

    // apply specialized before handler from outside...
    const appliedOptions = resolverOptions.before ?
        await Promise.resolve<IBeforeOptions>(resolverOptions.before(internalOptions, args, context, info)) :
        internalOptions;

    // finally apply authorization before handler from SequelizeGraphQLObjectType definition.
    const finalOptions = await Promise.resolve<IBeforeOptions>(graphQLTarget.before(appliedOptions, args, context, info));

    return finalOptions as IBeforeOptions;
}

export interface IListConnectionIdentifier {
    name: string;
    plural: string;
    identifier: string;
    origin: string | null;
    resolveDescription: string;
}

export function getListConnectionIdentifier(model: Sequelize.Model<any, any>, associationFn: any, type: "relay" | "offset", customIdentifier: string | null = null): IListConnectionIdentifier {

    const name = getName(model);
    const plural = getPlural(name);

    const postfix = type === "relay" ? "Connection" : "OffsetList";

    let identifier;
    let origin;
    let resolveDescription;

    if (associationFn.source) {
        origin = getName(associationFn.source);
        // nested resolve from other model (association)
        identifier = origin + plural + postfix;
        resolveDescription = `Resolved from ${origin} --> ${plural}`;
    } else {
        // resolve from global list (direct from a root query)
        origin = null; // origin is global, thus null.
        identifier = plural + postfix;
        resolveDescription = `Resolved from global --> ${plural}`;
    }

    if (customIdentifier) {
        // orgin and resolveDescription are now set, if customIdentifier was supplied, set it now!
        identifier = customIdentifier;
    }

    // check if we already use this identifier for another specified GraphQLType
    // if this is the case, add an increment PLUS log an error
    // developers should then pinPoint this id explicitly instead!
    const cache = gqlContext.getCache().listTypeCache;

    // initialize at -1 (increment immediately) - else increment
    cache[identifier] = (cache[identifier] || -1) + 1;

    // reassign identifier if we are after 0 (first dup)
    if (cache[identifier] > 0) {
        logger.warn({
            name,
            plural,
            postfix,
            identifier,
            origin,
            resolveDescription,
            cache
        }, `getListConnectionIdentifier: There are multiple ${identifier} list types defined.
            
            _${cache[identifier]} will be appended to this type!

            New Name: ${identifier + "_" + cache[identifier]}

            Beware that this number can change at any time, as the field resolving order is non deterministic.
            Instead, specify an unique name by passing { name: XXX } in the resolverOptions
        `);
    }

    identifier = cache[identifier] > 0 ? identifier + "_" + cache[identifier] : identifier;

    return {
        name,
        plural,
        identifier,
        resolveDescription,
        origin
    };
}

// soft-include (useful for defaultWhereMap includes): only returns the new include options if other include options on the same model were not specified yet
export function conditionalInclude(previousInclude: IIncludeOptions, newIncludeIfNotAvailable: IIncludeOptions): IIncludeOptions {
    return _.find(previousInclude, (includeOption: Sequelize.IncludeOptions) => {
        return _.find(newIncludeIfNotAvailable, { model: includeOption.model }) ? true : false;
    }) ? [] : newIncludeIfNotAvailable;
}

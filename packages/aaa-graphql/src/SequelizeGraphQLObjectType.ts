import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as Sequelize from "sequelize";

import * as mappers from "./mappers";

function noopResolve<T>(optionsOrResult: T, args: object, context: any, info: GQL.GraphQLResolveInfo): T {
    return optionsOrResult;
}

export interface SequelizeGraphQLObjectTypeConfig<TSource, TContext> extends GQL.GraphQLObjectTypeConfig<TSource, TContext> {
    before?: GQLS.IBeforeFn<TContext>;
    after?: GQLS.IAfterFn<TContext>;
    hasRelayNodeInterface: boolean;
    defaultOrderBy: GQL.GraphQLEnumType | null; // default order args can be directly supplied.
    defaultWhereMap: mappers.IWhereMap | null; // default where must can be directly supplied.
}

export default class SequelizeGraphQLObjectType<I extends Sequelize.Instance<any>> extends GQL.GraphQLObjectType {
    before: GQLS.IBeforeFn<any>;
    after: GQLS.IAfterFn<any>;
    hasRelayNodeInterface: boolean;
    defaultOrderBy: GQL.GraphQLEnumType | null;
    defaultWhereMap: mappers.IWhereMap | null;

    constructor(config: SequelizeGraphQLObjectTypeConfig<any, any>) {
        super(config);
        this.before = config.before ? config.before : noopResolve;
        this.after = config.after ? config.after : noopResolve;
        this.hasRelayNodeInterface = config.hasRelayNodeInterface;
        this.defaultOrderBy = config.defaultOrderBy;
        this.defaultWhereMap = config.defaultWhereMap;
    }
}

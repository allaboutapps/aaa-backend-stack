import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");
import * as Sequelize from "sequelize";
import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as _ from "lodash";

import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";
import * as gqlContext from "./gqlContext";
import * as mappers from "./mappers";

// helper functions to build a GraphQL Object Types + resolvers from Sequelize Models
export interface IModelBuildOptions<I extends Sequelize.Instance<A>, A, AM> {
    attributeOptions?: Partial<GQLS.IAttributeOptions<I, A>>;
    associations?: (joins: AM) => GQL.GraphQLFieldConfigMap<any, object>;
    before?: GQLS.IBeforeFn<object>;
    after?: GQLS.IAfterFn<object>;
    name?: string;
    description?: string;
    injectRelayNodeInterface?: boolean;
    customFields?: GQL.GraphQLFieldConfigMap<any, object>;
    defaultOrderBy?: GQL.GraphQLEnumType | null; // default order args can be directly supplied.
    defaultWhereMap?: mappers.IWhereMap | null; // default where must can be directly supplied.
}

// see https://github.com/mickhansen/graphql-sequelize#field-helpers
// these are the defaults we apply
const DEFAULT_ATTRIBUTE_OPTIONS = {
    exclude: [], // array of model attributes to ignore - default: []
    only: null, // only generate definitions for these model attributes - default: null
    globalId: true, // return an relay global id field - default: true (different than graphql-sequelize)
    map: {}, // rename fields - default: {}
    allowNull: false, // disable wrapping mandatory fields in `GraphQLNonNull` - default: false
    commentToDescription: false, // convert model comment to GraphQL description - default: false
    cache: {} // will be automatically replaced by the internals/Cache runtime instance
};

export default function buildObjectType<I extends Sequelize.Instance<A>, A, AM>(model: Sequelize.Model<I, A>, associationsMap: AM, options: IModelBuildOptions<I, A, AM> = {}): SequelizeGraphQLObjectType<I> {

    const name = options.name ? `${options.name} (${mappers.getName(model)})` : mappers.getName(model);
    const description = options.description ? `${options.description} (${mappers.getDescription(model)})` : mappers.getDescription(model);
    const hasRelayNodeInterface = options.injectRelayNodeInterface === true;
    const defaultOrderBy = options.defaultOrderBy ? options.defaultOrderBy : null;
    const defaultWhereMap = options.defaultWhereMap ? options.defaultWhereMap : null;

    if (hasRelayNodeInterface === true && _.get(options, "attributeOptions.globalId") === false) {
        throw new Error(`graphql.buildObjectType (${name}): Cannot inject relay node interface if attributeOptions.globalId is false!`);
    }

    logger.debug(`graphql.buildObjectType: Building ${name} (${description})`);

    return new SequelizeGraphQLObjectType<I>({
        name,
        description,
        fields: () => {
            logger.trace(`graphql.buildObjectType.fields(): ${name} evaluates fields...`);

            const originalOptions: GQLS.IAttributeOptions<I, A> = {
                ...DEFAULT_ATTRIBUTE_OPTIONS,
                ...options.attributeOptions, // overwrite through attribute options
            };

            const customExclude: any[] = _.keys(options.customFields);

            const attributeOptions: GQLS.IAttributeOptions<I, A> = {
                ...originalOptions,
                exclude: [
                    ...originalOptions.exclude,
                    ...customExclude
                ],
                cache: gqlContext.getCache().enumTypeCache // global cache here is always used and cannot be overwritten from outside
            };

            const fields = {
                ...GQLS.attributeFields(model, attributeOptions),
                ...(options.associations ? options.associations(associationsMap) : {}),
                ...options.customFields
            };

            return fields;

        },
        before: options.before,
        after: options.after,
        hasRelayNodeInterface,
        interfaces: (hasRelayNodeInterface === true ? [
            gqlContext.getRelay().nodeInterface // globalId is enabled (default setting), therefore add relay node id lookup interface to type. 
        ] : undefined),
        defaultOrderBy,
        defaultWhereMap
    });
}

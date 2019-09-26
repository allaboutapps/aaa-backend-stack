import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as GQL from "graphql";
import * as _ from "lodash";
import * as Sequelize from "sequelize";

import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";

// returns the GraphQLType of a specific attribute of a SequelizeGraphQLObjectType
export function mapModelAttributeToType<I extends Sequelize.Instance<A>, A>(graphQLTarget: SequelizeGraphQLObjectType<I>, model: Sequelize.Model<I, A>, property: Extract<keyof A, string>): GQL.GraphQLScalarType {

    const availableFields = graphQLTarget.getFields();
    const item = availableFields[property];

    logger.trace(`graphql.typeUtils.mapModelAttributeToType: ${graphQLTarget.name}: getting type of property ${property}...`);

    if (!item || !item.type) {

        logger.fatal({
            graphQLTarget,
            property,
            availableFields
        }, "graphql.typeUtils.mapModelAttributeToType: unable to lookup the type of property " + property);

        throw new Error("graphql.typeUtils.mapModelAttributeToType: unable to lookup the type of property " + property);

    }

    if (item.type instanceof GQL.GraphQLObjectType
        || item.type instanceof GQL.GraphQLList
        || item.type instanceof GQL.GraphQLInterfaceType
        || item.type instanceof GQL.GraphQLUnionType) {

        logger.fatal({
            graphQLTarget,
            property,
            availableFields,
            item
        }, "graphql.typeUtils.mapModelAttributeToType: unsupported instanceOf encountered for property " + property);

        throw new Error("graphql.typeUtils.mapModelAttributeToType: unsupported instanceOf encountered for property " + property);
    }

    return <GQL.GraphQLScalarType>item.type;
}

export interface IGraphQLArgumentConfigOptions {
    defaultValue: any;
    description: string;
}

// helper to directly get the argument definition
export function mapModelAttributeToTypeArg<I extends Sequelize.Instance<A>, A>(graphQLTarget: SequelizeGraphQLObjectType<I>, model: Sequelize.Model<I, A>, property: Extract<keyof A, string>, options: Partial<IGraphQLArgumentConfigOptions> = {}): GQL.GraphQLArgumentConfig {
    return {
        ...options,
        type: mapModelAttributeToType(graphQLTarget, model, property),
    };
}

import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");
import * as GQL from "graphql";
import * as _ from "lodash";
import * as Sequelize from "sequelize";
import { GraphQLFieldConfigArgumentMap } from "graphql";

import { getName } from "./mappers";
import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";

export interface IMapperArgsOptions {
    stripNonNullFromOriginalType: boolean; // defaults to true
    enforceNonNull: boolean; // default to false (all values are optional)
}

export function mapModelAttributesToArgs<I extends Sequelize.Instance<A>, A>(graphQLTarget: SequelizeGraphQLObjectType<I>, model: Sequelize.Model<I, A>, args: Array<keyof A>, options: Partial<IMapperArgsOptions> = {}): GQL.GraphQLFieldConfigArgumentMap {
    // void
    const availableFields = graphQLTarget.getFields();

    const resolvedArgs: GQL.GraphQLFieldConfigArgumentMap = _.reduce(availableFields, (sum, item, key) => {

        if (_.includes(args, key)) {

            // get non nulled arg type (unless explicitly forbidden)...
            let type = item.type instanceof GQL.GraphQLNonNull && options.stripNonNullFromOriginalType !== false ? item.type.ofType : item.type;

            // appy nonNull enforcement (only if explicitly supplied through options)
            if ((type instanceof GQL.GraphQLNonNull) === false && options.enforceNonNull === true) {
                type = new GQL.GraphQLNonNull(type);
            }

            return {
                ...sum,
                [key]: {
                    type,
                }
            };
        }

        return sum;
    }, {});

    logger.trace(`graphql.argUtils.mapModelAttributesToArgs: ${graphQLTarget.name}: mapping ${args.join(", ")}...`);

    // TODO: this can be catched during compile time if we have the attributeOptions type information from the model in the upstream SequelizeGraphqlObject available.    
    if (Object.keys(resolvedArgs).length !== args.length) {

        logger.fatal({
            graphQLTarget,
            args,
            resolvedArgs,
            availableFields,
            resolvedLength: Object.keys(resolvedArgs).length,
            suppliedLength: args.length
        }, "graphql.argUtils.mapModelAttributesToArgs: was unable to map all supplied string fields to updateable arguments");

        throw new Error("mapModelAttributesToArgs: was unable to map all supplied string fields to updateable arguments");
    }

    return resolvedArgs;
}

// generic update handler for bound and resolved args
function getMappedArgsUpdateHandler<I extends Sequelize.Instance<A>, A>(model: Sequelize.Model<I, A>, mappedArgs: GQL.GraphQLFieldConfigArgumentMap): (instance: I, args: object) => Promise<I> {

    // returns a bound function with the supplied update handling.    
    return async (instance: I, args: { [key: string]: any }) => {

        if (!instance) {
            return Promise.resolve(null);
        }

        logger.trace({
            mappedArgs,
            args
        }, `graphql.argUtils.getMappedArgsUpdateHandler (boundupdateHandler): examining`);

        _.each(mappedArgs, (value, key: string) => {

            logger.trace({
                key,
                isUndefined: _.isUndefined(args[key]),
                hasProperty: _.hasIn(instance, key),
                argValue: args[key],
                currentValue: instance[key]
            }, `graphql.argUtils.getMappedArgsUpdateHandler (boundupdateHandler): update if not undefined and property exists...`);

            if (_.hasIn(instance, key) === true) { // check if the instance actually has this property
                instance[key] = _.isUndefined(args[key]) === false ? args[key] : instance[key];
            }
        });

        const updatedInstance = await instance.save();
        return updatedInstance;
    };

}


export function mapModelAttributesToUpdateArgsAndHandler<I extends Sequelize.Instance<A>, A>(graphQLTarget: SequelizeGraphQLObjectType<I>, model: Sequelize.Model<I, A>, requestedArgs: Array<keyof A>, options: Partial<IMapperArgsOptions> = {}) {

    logger.trace(`graphql.argUtils.mapModelAttributesToUpdateArgsAndHandler: ${graphQLTarget.name} for model ${getName(model)}`);

    const args = mapModelAttributesToArgs(graphQLTarget, model, requestedArgs, options);

    return {
        updateArgs: args,
        updateHandler: getMappedArgsUpdateHandler(model, args)
    };

}


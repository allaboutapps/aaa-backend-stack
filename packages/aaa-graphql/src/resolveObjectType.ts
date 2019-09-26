import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as Sequelize from "sequelize";
import * as GQL from "graphql";
import * as GQLS from "graphql-sequelize";
import * as _ from "lodash";
import { IApolloErrorConstructor } from "apollo-errors";

import * as internalErrors from "./internalErrors";
import SequelizeGraphQLObjectType from "./SequelizeGraphQLObjectType";
import * as mappers from "./mappers";

export type IGQLSResolverOptions = GQLS.IResolverOptions<any>;

export interface IExtendedResolverOptions extends IGQLSResolverOptions {
    whereMap: mappers.IWhereMap;
    defaultArgs: boolean; // if defaultArgs should be applied (defaults to true)
}

export interface IModelInstanceResolveErrors {
    NOT_FOUND: IApolloErrorConstructor; // by default an internalErrors.ENTITY_NOT_FOUND
}

// default errors if not specified for above interface
// DEFAULT errors are only injected if this is a root resolver (model and associationFn are the same)
const DEFAULT_ERRORS: IModelInstanceResolveErrors = {
    NOT_FOUND: internalErrors.ENTITY_NOT_FOUND
};

export interface IExtendedObjectResolverOptions extends IExtendedResolverOptions {
    // defaults to false. Allows to require the parsed default arg (e.g. the uid) to be mandadory set (wrapped through GraphQLNonNull!
    // This is useful to disallow access to a by default exposed object
    ensureNonNullPrimaryKeyDefaultArgs: boolean;
    errors?: Partial<IModelInstanceResolveErrors>;
}

export default function resolveObjectType<I extends Sequelize.Instance<A>, A>(
    graphQLTarget: SequelizeGraphQLObjectType<I>,
    model: Sequelize.Model<I, A>,
    associationFn: Sequelize.Model<I, A> | void,
    resolverOptions: Partial<IExtendedObjectResolverOptions> = {}
): GQL.GraphQLFieldConfig<any, any> {

    const modelName = mappers.getName(model);
    logger.trace(`graphql.resolveObjectType: ${modelName}`);

    const defaultArgs: { [key: string]: any } = resolverOptions.defaultArgs === false ? {} : mappers.defaultArgs(model);

    if (resolverOptions.ensureNonNullPrimaryKeyDefaultArgs === true) {
        _.forOwn(defaultArgs, (value: GQL.GraphQLArgumentConfig, key: string) => {

            logger.trace(`graphql.resolveObjectType: ${modelName}: ensureNonNullPrimaryKeyDefaultArgs for ${key}`);

            defaultArgs[key] = {
                type: new GQL.GraphQLNonNull(value.type)
            };
        });
    }

    // DEFAULT_ERRORS are applied if this resolver is used as a root resolver (model and associationFn are the same)...
    const resolverErrors = <{ [error: string]: IApolloErrorConstructor }>{
        ...(model === associationFn ? DEFAULT_ERRORS : {}),
        ...(resolverOptions.errors ? resolverOptions.errors : {})
    };

    return {
        description: `Resolves a single ${modelName} instance. ${internalErrors.getFormattedErrorsDescription(resolverErrors)}`,
        type: graphQLTarget,
        resolve: GQLS.resolver(associationFn as Sequelize.Model<I, A>, {
            ...resolverOptions,
            before: async (options: mappers.IBeforeOptions, args: object, context: any, info: GQL.GraphQLResolveInfo) => {

                const parsedOptions = await mappers.parseBeforeHandler(graphQLTarget, resolverOptions, options, args, context, info);

                logger.trace({
                    parsedOptions,
                    args
                }, `graphql.resolveObjectType.before: ${modelName}`);

                return parsedOptions;
            },
            after: async (result: I, args: object, context: any, info: GQL.GraphQLResolveInfo) => {
                const internalResult = result;

                if ((_.isNull(internalResult) || _.isUndefined(internalResult))
                    && resolverErrors.NOT_FOUND) {

                    throw new resolverErrors.NOT_FOUND({
                        name: graphQLTarget.name,
                        args
                    });
                }

                // apply specialized after handler from outside...
                const appliedResult = resolverOptions.after ?
                    await Promise.resolve<I>(resolverOptions.after(internalResult, args, context, info)) :
                    internalResult;

                // finally apply authorization after handler from SequelizeGraphQLObjectType definition.
                const finalResult = await Promise.resolve<I>(graphQLTarget.after(appliedResult, args, context, info));

                logger.trace({
                    finalResult
                }, `graphql.resolveObjectType.after: ${modelName}`);

                return finalResult;
            }
        } as any),
        args: {
            ...defaultArgs,
            ...(graphQLTarget.defaultWhereMap ? graphQLTarget.defaultWhereMap : {}),
            ...resolverOptions.whereMap
        }
    };
}


// resolveObjectType({} as any, {} as any, {} as any, {

//     before: (options, args, context, info) => {
//         // Enforce: Return the user who made the request
//         options.where = {
//             uid: context.credentials.user.uid
//         };
//         return options;
//     },
//     defaultArgs: false // primary key should not be available as default arg
// });


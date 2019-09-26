import * as _ from "lodash";

import {
    fromGlobalId,
    getRelay,
    GQL,
    resolveObjectType,
    SequelizeGraphQLObjectType
} from "@aaa-backend-stack/graphql";
import { IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import { ITypes } from "./types";

// TODO: eventually move this into @aaa-backend-stack/graphql

// Support relay client direct node lookups by globalID (on the root schema)
// See https://github.com/mickhansen/graphql-sequelize/blob/master/docs/relay.md#node-lookups
// Note: As we specify custom before and after handlers directly on the type (e.g. for ACLs)
// we must make sure that these handlers are always called at node lookups (therefore a custom resolve is specified)
export default function defineQueries(models: IModels, types: ITypes): GQL.GraphQLFieldConfigMap<any, any> {

    // Define the supported direct node lookups
    // by default all types that have a globalRelayId defined in their type, are injected here!
    getRelay().nodeTypeMapper.mapTypes(_.reduce(types, (
        sum: { [key: string]: SequelizeGraphQLObjectType<SEQUELIZE.Instance<any>> },
        graphqlType: SequelizeGraphQLObjectType<SEQUELIZE.Instance<any>>,
        key: string) => {
        if (graphqlType.hasRelayNodeInterface === true) {
            // this type has a relay node interface
            return {
                ...sum,
                [key]: graphqlType
            };
        }

        return sum;
    }, {}));

    const node = getRelay().nodeField;

    return {
        node: {
            ...node,
            resolve: async (options, args: any, context, info) => {
                // customized from https://github.com/mickhansen/graphql-sequelize/blob/master/src/relay.js#L41
                // issue: before and after was not supported, options and info is not passed at resolver
                // see: https://github.com/mickhansen/graphql-sequelize/issues/92
                // see: https://github.com/mickhansen/graphql-sequelize/issues/171
                const { type, id } = fromGlobalId(args.id);
                const nodeType = getRelay().nodeTypeMapper.item(type);

                if (nodeType && typeof nodeType.resolve === "function") {
                    const resol = await Promise.resolve(nodeType.resolve(args.id, context)); // TODO: eventually pass more to nodeTypeMapper
                    if (resol) {
                        resol.__graphqlType__ = type;
                    }

                    return resol;
                }

                // map type to model
                const resolvedModel = (<any>models)[type];
                const resolvedType = (<any>types)[type];

                if (!resolvedModel || !resolvedType) {
                    return nodeType ? nodeType.type : null;
                }

                const objectTypeResolver = resolveObjectType(resolvedType, resolvedModel, resolvedModel);
                const res = await objectTypeResolver.resolve(options, { [resolvedModel.primaryKeyAttribute]: id }, context, info);

                if (res) {
                    res.__graphqlType__ = type;
                }

                return res;
            }
        }
    };

}

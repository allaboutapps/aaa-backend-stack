import * as _ from "lodash";
import { GQL } from "@aaa-backend-stack/graphql";

export function getSchemaInfo(graphQLSchema: GQL.GraphQLSchema) {

    const mutations = formatRootObjectType(graphQLSchema.getMutationType());
    const queries = formatRootObjectType(graphQLSchema.getQueryType());
    const subscriptions = formatRootObjectType(graphQLSchema.getSubscriptionType());

    return {
        queries,
        mutations,
        subscriptions
    };
}

function formatRootObjectType(objectType: GQL.GraphQLObjectType | null | undefined): object | false {

    if (!objectType
        || _.isUndefined(objectType)
        || _.isUndefined(objectType.getFields)) {

        return false;
    }

    return _.reduce(objectType.getFields(), (sum, value, key) => {
        return {
            ...sum,
            [key + `(${_.join(_.map(value.args, (arg) => {
                return arg.name;
            }), ", ")}) => ${value.type.toString()}`]: value.description
        };
    }, {});
}

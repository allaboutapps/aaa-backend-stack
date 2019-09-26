import { GQL, resolveObjectType } from "@aaa-backend-stack/graphql";
import { IModels } from "@aaa-backend-stack/storage";

import { ITypes } from "../types";

export default function defineQueries(models: IModels, types: ITypes): GQL.GraphQLFieldConfigMap<any, any> {

    return {
        me: resolveObjectType(types.User, models.User, models.User, {

            before: (options, args, context, info) => {
                // Enforce: Return the user who made the request
                options.where = {
                    uid: context.credentials.user.uid
                };

                return options;
            },
            defaultArgs: false // primary key should not be available as default arg
        })
    };

}

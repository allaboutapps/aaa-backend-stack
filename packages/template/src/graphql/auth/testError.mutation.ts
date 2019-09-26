import { GQL } from "@aaa-backend-stack/graphql";
import { IModels } from "@aaa-backend-stack/storage";

import * as errors from "../errors";
import { ITypes } from "../types";

export default function defineMutations(models: IModels, types: ITypes): GQL.GraphQLFieldConfigMap<any, any> {

    return {
        testError: {
            description: "Throws a test error",
            type: GQL.GraphQLBoolean,
            resolve: async (options, { }, context, info) => {
                throw new errors.TEST_ERROR();
            }
        }
    };

}

import {
    buildObjectType,
    resolveListType,
    resolveObjectType,
    SequelizeGraphQLObjectType
} from "@aaa-backend-stack/graphql";
import { IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import * as _AppUserProfile from "../models/AppUserProfile";
import * as _Permission from "../models/Permission";
import * as _User from "../models/User";

export type ITypes = {
    // TODO: get generic from P in keyof --> M<I, A>, not sure if this is even possible
    [P in keyof IModels]?: SequelizeGraphQLObjectType<SEQUELIZE.Instance<any>>;
};

export default function processGraphqlTypes(models: IModels): ITypes {

    // Note: If this definition gets to large, move the Types definitions to a ./types folder
    // and combine the types here similar to ./queries.ts and ./mutations.ts
    // tslint:disable-next-line:no-unnecessary-local-variable
    const TYPES: ITypes = {
        User: buildObjectType(models.User, _User.getAssociations(), {
            attributeOptions: {
                only: ["uid", "username", "isActive"] // limit available properties
            },
            associations: (joins) => {
                return {
                    appUserProfile: resolveObjectType(TYPES.AppUserProfile, models.AppUserProfile, joins.AppUserProfile),
                    permissions: resolveListType(TYPES.Permission, models.Permission, joins.Permissions)
                };
            }
        }),
        Permission: buildObjectType(models.Permission, _Permission.getAssociations(), {
            associations: (joins) => {
                return {
                    users: resolveListType(TYPES.User, models.User, joins.Users)
                };
            }
        }),
        AppUserProfile: buildObjectType(models.AppUserProfile, _AppUserProfile.getAssociations(), {
            associations: (joins) => {
                return {
                    user: resolveObjectType(TYPES.User, models.User, joins.User)
                };
            }
        })
    };

    return TYPES;
}

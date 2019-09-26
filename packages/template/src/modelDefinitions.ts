import AccessToken, { IInstance as IInstanceAccessToken, IModel as IModelAccessToken } from "./models/AccessToken";
import AppUserProfile, { IInstance as IInstanceAppUserProfile, IModel as IModelAppUserProfile } from "./models/AppUserProfile";
import PasswordResetToken, { IInstance as IInstancePasswordResetToken, IModel as IModelPasswordResetToken } from "./models/PasswordResetToken";
import Permission, { IInstance as IInstancePermission, IModel as IModelPermission } from "./models/Permission";
import PushToken, { IInstance as IInstancePushToken, IModel as IModelPushToken } from "./models/PushToken";
import RefreshToken, { IInstance as IInstanceRefreshToken, IModel as IModelRefreshToken } from "./models/RefreshToken";
import User, { IInstance as IInstanceUser, IModel as IModelUser } from "./models/User";
import UserPermission, { IInstance as IInstanceUserPermission, IModel as IModelUserPermission } from "./models/UserPermission";

// directly augment the storage module...
declare module "@aaa-backend-stack/storage" {

    // easily allow access to model instances typings
    namespace IInstances {
        export type IAccessToken = IInstanceAccessToken;
        export type IAppUserProfile = IInstanceAppUserProfile;
        export type IPasswordResetToken = IInstancePasswordResetToken;
        export type IPermission = IInstancePermission;
        export type IPushToken = IInstancePushToken;
        export type IRefreshToken = IInstanceRefreshToken;
        export type IUser = IInstanceUser;
        export type IUserPermission = IInstanceUserPermission;
    }

    // statically type storage.model.MODEL property access
    export interface IModels {
        AccessToken: IModelAccessToken;
        AppUserProfile: IModelAppUserProfile;
        PasswordResetToken: IModelPasswordResetToken;
        Permission: IModelPermission;
        PushToken: IModelPushToken;
        RefreshToken: IModelRefreshToken;
        User: IModelUser;
        UserPermission: IModelUserPermission;
    }

    // augment the readonly getter
    // tslint:disable-next-line:interface-name
    interface Storage {
        readonly models: IModels;
    }
}

// define which models should actually be initialized
const modelDefinitions = {
    AccessToken,
    AppUserProfile,
    PasswordResetToken,
    Permission,
    PushToken,
    RefreshToken,
    User,
    UserPermission
};

export default modelDefinitions;

import * as _ from "lodash";

import * as REST from "@aaa-backend-stack/rest";
import * as serverdate from "@aaa-backend-stack/serverdate";
import { IDefaultModelAttributes, IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import CONFIG from "../configure";
import { IFacebookUserInfo, IGoogleUserInfo } from "../services/auth";
import { IAttributes as IAccessTokenAttributes, IInstance as IAccessTokenInstance, IPrimaryKey as IAccessTokenPrimaryKey } from "./AccessToken";
import { IAttributes as IAppUserProfileAttributes, IInstance as IAppUserProfileInstance, IPrimaryKey as IAppUserProfilePrimaryKey } from "./AppUserProfile";
import { IAttributes as IPasswordResetTokenAttributes, IInstance as IPasswordResetTokenInstance, IPrimaryKey as IPasswordResetTokenPrimaryKey } from "./PasswordResetToken";
import { IAttributes as IPermissionAttributes, IInstance as IPermissionInstance, IPrimaryKey as IPermissionPrimaryKey } from "./Permission";
import { IAttributes as IRefreshTokenAttributes, IInstance as IRefreshTokenInstance, IPrimaryKey as IRefreshTokenPrimaryKey } from "./RefreshToken";
import { IAttributes as IUserPermissionAttributes } from "./UserPermission";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    uid: IPrimaryKey;
    username: string;
    isActive: boolean;
    // Email/password authentication
    password?: string | null;
    salt?: string | null;
    // Facebook OpenID authentication
    facebookId?: string | null;
    facebookInfo?: IFacebookUserInfo | null;
    // Google OpenID authentication
    googleId?: string | null;
    googleInfo?: IGoogleUserInfo | null;

    AppUserProfile?: IAppUserProfileInstance; // only available if lazy include loaded
}
export interface IInstance extends SEQUELIZE.Instance<IAttributes>, IAttributes {

    // Associations hooked up methods
    getRefreshTokens: SEQUELIZE.HasManyGetAssociationsMixin<IRefreshTokenInstance>;
    setRefreshTokens: SEQUELIZE.HasManySetAssociationsMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    addRefreshTokens: SEQUELIZE.HasManyAddAssociationsMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    addRefreshToken: SEQUELIZE.HasManyAddAssociationMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    createRefreshToken: SEQUELIZE.HasManyCreateAssociationMixin<Partial<IRefreshTokenAttributes>>;
    removeRefreshToken: SEQUELIZE.HasManyRemoveAssociationMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    removeRefreshTokens: SEQUELIZE.HasManyRemoveAssociationsMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    hasRefreshToken: SEQUELIZE.HasManyHasAssociationMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    hasRefreshTokens: SEQUELIZE.HasManyHasAssociationsMixin<IRefreshTokenInstance, IRefreshTokenPrimaryKey>;
    countRefreshTokens: SEQUELIZE.HasManyCountAssociationsMixin;

    getAccessTokens: SEQUELIZE.HasManyGetAssociationsMixin<IAccessTokenInstance>;
    setAccessTokens: SEQUELIZE.HasManySetAssociationsMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    addAccessTokens: SEQUELIZE.HasManyAddAssociationsMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    addAccessToken: SEQUELIZE.HasManyAddAssociationMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    createAccessToken: SEQUELIZE.HasManyCreateAssociationMixin<Partial<IAccessTokenAttributes>>;
    removeAccessToken: SEQUELIZE.HasManyRemoveAssociationMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    removeAccessTokens: SEQUELIZE.HasManyRemoveAssociationsMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    hasAccessToken: SEQUELIZE.HasManyHasAssociationMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    hasAccessTokens: SEQUELIZE.HasManyHasAssociationsMixin<IAccessTokenInstance, IAccessTokenPrimaryKey>;
    countAccessTokens: SEQUELIZE.HasManyCountAssociationsMixin;

    getPermissions: SEQUELIZE.BelongsToManyGetAssociationsMixin<IPermissionInstance>;
    setPermissions: SEQUELIZE.BelongsToManySetAssociationsMixin<IPermissionInstance, IPermissionPrimaryKey, IUserPermissionAttributes>;
    addPermissions: SEQUELIZE.BelongsToManyAddAssociationsMixin<IPermissionInstance, IPermissionPrimaryKey, IUserPermissionAttributes>;
    addPermission: SEQUELIZE.BelongsToManyAddAssociationMixin<IPermissionInstance, IPermissionPrimaryKey, IUserPermissionAttributes>;
    createPermission: SEQUELIZE.BelongsToManyCreateAssociationMixin<IPermissionAttributes, IUserPermissionAttributes>;
    removePermission: SEQUELIZE.BelongsToManyRemoveAssociationMixin<IPermissionInstance, IPermissionPrimaryKey>;
    removePermissions: SEQUELIZE.BelongsToManyRemoveAssociationsMixin<IPermissionInstance, IPermissionPrimaryKey>;
    hasPermission: SEQUELIZE.BelongsToManyHasAssociationMixin<IPermissionInstance, IPermissionPrimaryKey>;
    hasPermissions: SEQUELIZE.BelongsToManyHasAssociationsMixin<IPermissionInstance, IPermissionPrimaryKey>;
    countPermissions: SEQUELIZE.BelongsToManyCountAssociationsMixin;

    getPasswordResetTokens: SEQUELIZE.HasManyGetAssociationsMixin<IPasswordResetTokenInstance>;
    setPasswordResetTokens: SEQUELIZE.HasManySetAssociationsMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    addPasswordResetTokens: SEQUELIZE.HasManyAddAssociationsMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    addPasswordResetToken: SEQUELIZE.HasManyAddAssociationMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    createPasswordResetToken: SEQUELIZE.HasManyCreateAssociationMixin<IPasswordResetTokenAttributes>;
    removePasswordResetToken: SEQUELIZE.HasManyRemoveAssociationMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    removePasswordResetTokens: SEQUELIZE.HasManyRemoveAssociationsMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    hasPasswordResetToken: SEQUELIZE.HasManyHasAssociationMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    hasPasswordResetTokens: SEQUELIZE.HasManyHasAssociationsMixin<IPasswordResetTokenInstance, IPasswordResetTokenPrimaryKey>;
    countPasswordResetTokens: SEQUELIZE.HasManyCountAssociationsMixin;

    createAppUserProfile: SEQUELIZE.HasOneCreateAssociationMixin<IAppUserProfileAttributes>;
    getAppUserProfile: SEQUELIZE.HasOneGetAssociationMixin<IAppUserProfileInstance>;
    hasAppUserProfile: SEQUELIZE.HasOneSetAssociationMixin<IAppUserProfileInstance, IAppUserProfilePrimaryKey>;

    getUserJsonObject(): Promise<any>;
    getCMSUserJsonObject(): Promise<any>;
    setPassword(password: string): Promise<Object>;
    getScopeJsonArray(): Promise<string[]>;
    hasScope(str: string): Promise<boolean>;
    getNewAccessToken(): Promise<IAccessTokenInstance>;
    getNewRefreshToken(): Promise<IRefreshTokenInstance>;
    isGuest(): boolean;
    isFacebookUser(): boolean;
    isGoogleUser(): boolean;
    isLocalUser(): boolean;
}

export type IUserInstance = IInstance; // allow to resue old type

export interface IModel extends SEQUELIZE.Model<IInstance, Partial<IAttributes>> {
    generateBasicAuthValidateFunction(models: IModels): (request: REST.HAPI.Request, username: string, password: string, callback: Function) => {};
    generateBearerValidateFunction(models: IModels): (token: string, callback: Function) => {};
}

type IAssociations = {
    RefreshTokens: any;
    AccessTokens: any;
    Permissions: any;
    AppUserProfile: any;
    PasswordResetTokens: any;
    PushTokens: any;
};

let associations: IAssociations;

export function getAssociations() {
    return associations;
}

// tslint:disable-next-line:max-func-body-length
export default function createUserModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const User = sequelize.define<IInstance, IAttributes>("User", {
        uid: {
            type: SEQUELIZE.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: SEQUELIZE.UUIDV4
        },
        username: { // only used for password authentication, null for guest users
            type: SEQUELIZE.STRING,
            allowNull: true,
            unique: true
        },
        password: { // only used for password authentication, null for guest users
            type: SEQUELIZE.STRING(2048)
        },
        salt: { // only used for password authentication, null for guest users
            type: SEQUELIZE.STRING(2048)
        },
        facebookId: {
            type: SEQUELIZE.STRING,
            unique: true,
            allowNull: true,
            defaultValue: null
        },
        facebookInfo: {
            type: SEQUELIZE.JSON,
            allowNull: true,
            defaultValue: null
        },
        googleId: {
            type: SEQUELIZE.STRING,
            unique: true,
            allowNull: true,
            defaultValue: null
        },
        googleInfo: {
            type: SEQUELIZE.JSON,
            allowNull: true,
            defaultValue: null
        },
        isActive: {
            type: SEQUELIZE.BOOLEAN,
            defaultValue: true
        }
    }, {

            classMethods: {
                associate: function (models: IModels) {
                    // tslint:disable:no-void-expression
                    associations = {
                        AccessTokens: User.hasMany(models.AccessToken, {
                            onDelete: "CASCADE"
                        }),
                        AppUserProfile: User.hasOne(models.AppUserProfile, {
                            onDelete: "CASCADE"
                        }),
                        PasswordResetTokens: User.hasMany(models.PasswordResetToken, {
                            onDelete: "CASCADE"
                        }),
                        Permissions: User.belongsToMany(models.Permission, {
                            through: {
                                model: models.UserPermission
                            },
                            foreignKey: "UserUid",
                            onDelete: "SET NULL"
                        }),
                        PushTokens: User.hasMany(models.PushToken, {
                            onDelete: "CASCADE"
                        }),
                        RefreshTokens: User.hasMany(models.RefreshToken, {
                            onDelete: "CASCADE"
                        })
                    };
                    // tslint:enable:no-void-expression
                }
            },

            instanceMethods: {
                // convenience function to test if a user is a special kind --> guest user (if any of these fields
                // is null, no normal password or refreshtoken authentication is allowed, therefore he is a guest)
                isGuest: function (this: IInstance): boolean {
                    return !this.isFacebookUser() && !this.isGoogleUser() && (this.password === null || this.salt === null || this.username === null);
                },
                isFacebookUser: function (this: IInstance): boolean {
                    return !_.isNil(this.facebookId) && !_.isNil(this.facebookInfo);
                },
                isGoogleUser: function (this: IInstance): boolean {
                    return !_.isNil(this.googleId) && !_.isNil(this.googleInfo);
                },
                isLocalUser: function (this: IInstance): boolean {
                    return !this.isFacebookUser() && !this.isGoogleUser();
                },
                hasAppUserProfile: async function (this: IInstance): Promise<boolean> {
                    const appUserProfile = await this.getAppUserProfile();

                    return appUserProfile === null ? false : true;
                },
                getGuestAccessToken: async function (this: IInstance) {
                    if (this.isGuest() === false) {
                        throw new Error("only guest users are allowed to get guest accessTokens");
                    }

                    const accessTokens = await this.getAccessTokens();
                    if (accessTokens.length >= 1) {
                        return accessTokens[0]; // return the first encountered guest accesstoken (guest users can have multiple accessTokens due to the usermerging functionality)
                    }

                    // create a new one, this guest user has no accessToken currently!
                    return this.createAccessToken({
                        validUntil: null // valid forever.
                    });
                },
                getNewRefreshToken: function (this: IInstance) { // for password authentication
                    if (this.isGuest() === true) {
                        throw new Error("guest users are not allowed to generate any kind of refreshTokens.");
                    }

                    return this.createRefreshToken({});
                },
                getNewAccessToken: function (this: IInstance) { // for refresh authentication
                    if (this.isGuest() === true) {
                        throw new Error("guest users are not allowed to generate new accessTokens.");
                    }

                    return this.createAccessToken({
                        validUntil: serverdate.getMoment().add(CONFIG.auth.tokenValidity, "milliseconds").toDate()
                    });
                },
                setPassword: async function (this: IInstance, password: string) {
                    const salt = await CONFIG.hashing.createSalt();
                    const hashedPassword = await CONFIG.hashing.hashPassword(password, salt);
                    this.salt = salt;
                    this.password = hashedPassword;
                },
                getScopeJsonArray: async function (this: IInstance): Promise<string[]> { // returns an array of scopes this user owns

                    if (this.isGuest()) {
                        // shortcut: guests will never have any explit additional permissions in the database set
                        // utilize this and set the default guest permission scope.
                        return [CONFIG.auth.scope.guestScopeIdentifier];
                    }

                    const permissions = await this.getPermissions();
                    if (permissions.length === 0) { // no explicit permission in database? set default user scope (has authenticated itself via credentials)
                        // (this must not exist in the database, any other scopes (=permissions) are appended automatically)
                        return [CONFIG.auth.scope.userScopeIdentifier];
                    }

                    return _.map(permissions, "scope"); // explizit permissions in db were set, don't append the default user scope.
                },
                // async, returns true if the user owns the specified scope (permission/role)
                hasScope: async function (this: IInstance, scopeKey: string) {
                    const scope = await this.getScopeJsonArray();

                    return _.includes(scope, scopeKey);
                },
                getUserJsonObject: async function (this: IInstance) {
                    const { uid, username } = this;
                    const scope = await this.getScopeJsonArray();

                    return {
                        uid,
                        username,
                        scope
                    };
                }
            }
        });

    return User;
}

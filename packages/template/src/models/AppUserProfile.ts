import { IDefaultModelAttributes, IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import { IPublicAppUserProfile } from "../api/user/_types";
import { IAttributes as IUserAttributes, IInstance as IUserInstance, IPrimaryKey as IUserPrimaryKey } from "./User";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    hasGDPROptOut: boolean;
    legalAcceptedAt: Date | null;

    UserUid: IPrimaryKey;

    User?: IUserInstance;
}

export interface IInstance extends SEQUELIZE.Instance<IAttributes>, IAttributes {
    getUser: SEQUELIZE.BelongsToGetAssociationMixin<IUserInstance>;
    setUser: SEQUELIZE.BelongsToSetAssociationMixin<IUserInstance, IUserPrimaryKey>;
    createUser: SEQUELIZE.BelongsToCreateAssociationMixin<IUserAttributes>;
    getAppUserProfileJsonObject(): Promise<Object>; // todo add interface for user profile schema
    getPublicAppUserProfileJSONObject(): Promise<IPublicAppUserProfile>;
}

export type IAppUserProfileInstance = IInstance;

export interface IModel extends SEQUELIZE.Model<IInstance, Partial<IAttributes>> { }

type IAssociations = {
    User: any;
};

let associations: IAssociations;

export function getAssociations() {
    return associations;
}

export default function createAppUserProfileModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const AppUserProfile = sequelize.define<IInstance, IAttributes>("AppUserProfile", {
        UserUid: {
            type: SEQUELIZE.UUID,
            primaryKey: true, // the foreign key of the User is the primary key of the AppUserProfile
            allowNull: false,
            references: {
                model: "Users",
                key: "uid"
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
        },
        hasGDPROptOut: {
            type: SEQUELIZE.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        legalAcceptedAt: {
            type: SEQUELIZE.DATE,
            allowNull: true,
            defaultValue: null
        }
        // ... your custom fields ...
    }, {
            classMethods: {
                associate: function (models: IModels) {
                    // tslint:disable:no-void-expression
                    associations = {
                        // foreign key of User is primary key of this model
                        User: AppUserProfile.belongsTo(models.User, {
                            foreignKey: "UserUid", // fk in current model
                            targetKey: "uid" // reference primary key in other model
                        })
                    };
                    // tslint:enable:no-void-expression
                }
            },
            instanceMethods: {
                getAppUserProfileJsonObject: async function (this: IInstance): Promise<Object> {
                    const user = await this.getUser();
                    const userJson = await user.getUserJsonObject();

                    return {
                        uid: userJson.uid,
                        scope: userJson.scope,

                        // gdpr: we pass these flags for easier client-consumption.
                        hasGDPROptOut: this.hasGDPROptOut,
                        legalAcceptedAt: this.legalAcceptedAt
                    };
                },
                getPublicAppUserProfileJSONObject: async function (this: IInstance): Promise<IPublicAppUserProfile> {
                    const user = await this.getUser();

                    return {
                        uid: user.uid
                    };
                }
            }
        });

    return AppUserProfile;
}

import { IDefaultModelAttributes, IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import { IAttributes as IUserAttributes, IInstance as IUserInstance, IPrimaryKey as IUserPrimaryKey } from "./User";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    uid: IPrimaryKey;
    deviceType: string;
    deviceToken: string;
    UserUid: IUserPrimaryKey;
}
export interface IInstance extends SEQUELIZE.Instance<IAttributes>, IAttributes {
    getUser: SEQUELIZE.BelongsToGetAssociationMixin<IUserInstance>;
    setUser: SEQUELIZE.BelongsToSetAssociationMixin<IUserInstance, IUserPrimaryKey>;
    createUser: SEQUELIZE.BelongsToCreateAssociationMixin<IUserAttributes>;
}

export interface IModel extends SEQUELIZE.Model<IInstance, Partial<IAttributes>> { }

export type IPushTokenInstance = IInstance;

type IAssociations = {
    User: any;
};

let associations: IAssociations;

export function getAssociations() {
    return associations;
}

export default function createUserPermissionModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const PushToken = sequelize.define<IInstance, IAttributes>("PushToken", {
        uid: {
            type: SEQUELIZE.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: SEQUELIZE.UUIDV4
        },
        deviceType: {
            type: SEQUELIZE.STRING,
            allowNull: false
        },
        deviceToken: {
            type: SEQUELIZE.STRING(1024),
            allowNull: false
        },
        UserUid: {
            type: SEQUELIZE.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "uid"
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
        }
    }, {
            indexes: [{
                name: "PushTokens_unique_deviceType_deviceToken",
                unique: true,
                fields: ["deviceType", "deviceToken"]
            }],
            classMethods: {
                associate: function (models: IModels) {
                    // tslint:disable:no-void-expression
                    associations = {
                        User: PushToken.belongsTo(models.User)
                    };
                    // tslint:enable:no-void-expression
                }
            }
        });

    return PushToken;
}

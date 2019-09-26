import { IDefaultModelAttributes, IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import { IAttributes as IUserAttributes, IInstance as IUserInstance, IPrimaryKey as IUserPrimaryKey } from "./User";
import { IAttributes as IUserPermissionAttributes } from "./UserPermission";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    uid: IPrimaryKey;
    scope: string;
}
export interface IInstance extends SEQUELIZE.Instance<IAttributes>, IAttributes {
    getUsers: SEQUELIZE.BelongsToManyGetAssociationsMixin<IUserInstance>;
    setUsers: SEQUELIZE.BelongsToManySetAssociationsMixin<IUserInstance, IUserPrimaryKey, IUserPermissionAttributes>;
    addUsers: SEQUELIZE.BelongsToManyAddAssociationsMixin<IUserInstance, IUserPrimaryKey, IUserPermissionAttributes>;
    addUser: SEQUELIZE.BelongsToManyAddAssociationMixin<IUserInstance, IUserPrimaryKey, IUserPermissionAttributes>;
    createUser: SEQUELIZE.BelongsToManyCreateAssociationMixin<IUserAttributes, IUserPermissionAttributes>;
    removeUser: SEQUELIZE.BelongsToManyRemoveAssociationMixin<IUserInstance, IUserPrimaryKey>;
    removeUsers: SEQUELIZE.BelongsToManyRemoveAssociationsMixin<IUserInstance, IUserPrimaryKey>;
    hasUser: SEQUELIZE.BelongsToManyHasAssociationMixin<IUserInstance, IUserPrimaryKey>;
    hasUsers: SEQUELIZE.BelongsToManyHasAssociationsMixin<IUserInstance, IUserPrimaryKey>;
    countUsers: SEQUELIZE.BelongsToManyCountAssociationsMixin;
}

export interface IModel extends SEQUELIZE.Model<IInstance, Partial<IAttributes>> { }

type IAssociations = {
    Users: any;
};

let associations: IAssociations;

export function getAssociations() {
    return associations;
}

export default function createPermissionModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const Permission = sequelize.define<IInstance, IAttributes>("Permission", {
        uid: {
            type: SEQUELIZE.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: SEQUELIZE.UUIDV4
        },
        scope: {
            type: SEQUELIZE.STRING,
            allowNull: false,
            unique: true
        }
    }, {
            classMethods: {
                associate: function (models: IModels) {
                    // tslint:disable:no-void-expression
                    associations = {
                        Users: Permission.belongsToMany(models.User, {
                            through: {
                                model: models.UserPermission
                            },
                            foreignKey: "PermissionUid",
                            constraints: false, // created Permissions do not initially need any related users
                            onDelete: "SET NULL" // don't fully delete users if their permission is removed.
                        })
                    };
                    // tslint:enable:no-void-expression
                }
            }
        });

    return Permission;
}

import { IDefaultModelAttributes, SEQUELIZE } from "@aaa-backend-stack/storage";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    UserUid: IPrimaryKey;
    PermissionUid: IPrimaryKey;
}
export interface IInstance extends SEQUELIZE.Instance<IAttributes>, IAttributes { }

export interface IModel extends SEQUELIZE.Model<IInstance, Partial<IAttributes>> { }

export default function createUserPermissionModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const UserPermission = sequelize.define<IInstance, IAttributes>("UserPermission", {
        UserUid: {
            type: SEQUELIZE.UUID,
            primaryKey: true,
            references: {
                model: "Users",
                key: "uid"
            },
            onUpdate: "SET NULL",
            onDelete: "SET NULL"
        },
        PermissionUid: {
            type: SEQUELIZE.UUID,
            primaryKey: true,
            references: {
                model: "Permissions",
                key: "uid"
            },
            onUpdate: "SET NULL",
            onDelete: "SET NULL"
        }
    }, {});

    return UserPermission;
}

import { IDefaultModelAttributes, IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import { IAttributes as IUserAttributes, IInstance as IUserInstance, IPrimaryKey as IUserPrimaryKey } from "./User";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    token: IPrimaryKey;
    validUntil: Date;
    UserUid: IUserPrimaryKey;

    User?: IUserInstance;
}
export interface IInstance extends SEQUELIZE.Instance<IAttributes>, IAttributes {
    getUser: SEQUELIZE.BelongsToGetAssociationMixin<IUserInstance>;
    setUser: SEQUELIZE.BelongsToSetAssociationMixin<IUserInstance, IUserPrimaryKey>;
    createUser: SEQUELIZE.BelongsToCreateAssociationMixin<IUserAttributes>;
}

export interface IModel extends SEQUELIZE.Model<IInstance, Partial<IAttributes>> { }

type IAssociations = {
    User: any;
};

let associations: IAssociations;

export function getAssociations() {
    return associations;
}

export default function createPasswordResetTokenModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const PasswordResetToken = sequelize.define<IInstance, IAttributes>("PasswordResetToken", {
        token: {
            type: SEQUELIZE.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: SEQUELIZE.UUIDV4
        },
        validUntil: {
            type: SEQUELIZE.DATE,
            allowNull: false
        },
        UserUid: {
            type: SEQUELIZE.UUID,
            references: {
                model: "Users",
                key: "uid"
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
        }
    }, {
            classMethods: {
                associate: function (models: IModels) {
                    // tslint:disable:no-void-expression
                    associations = {
                        User: PasswordResetToken.belongsTo(models.User)
                    };
                    // tslint:enable:no-void-expression
                }
            }
        });

    return PasswordResetToken;
}

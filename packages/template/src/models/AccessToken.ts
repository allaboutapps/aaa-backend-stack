import { IDefaultModelAttributes, IModels, SEQUELIZE } from "@aaa-backend-stack/storage";

import { IAttributes as IUserAttributes, IInstance as IUserInstance, IPrimaryKey as IUserPrimaryKey } from "./User";

export type IPrimaryKey = string;

export interface IAttributes extends IDefaultModelAttributes {
    token: IPrimaryKey;
    validUntil: Date;
    UserUid: IUserPrimaryKey;
    User?: IUserInstance; // available if lazy loaded
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

export default function createAccessTokenModel(sequelize: SEQUELIZE.Sequelize) {
    // tslint:disable-next-line:no-unnecessary-local-variable
    const AccessToken = sequelize.define<IInstance, IAttributes>("AccessToken", {
        token: {
            type: SEQUELIZE.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: SEQUELIZE.fn("uuid_generate_v4") // needs the properly installed postgres uuid extension to work
        },
        validUntil: {
            type: SEQUELIZE.DATE,
            allowNull: true // for guest user, not defined validUntil AccessTokens will be valid forever!
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
                        User: AccessToken.belongsTo(models.User)
                    };
                    // tslint:enable:no-void-expression
                },
                destroyExpiredTokens: function () {
                    console.warn("attention destroyExpiredTokens is being executed, potential fully lock of all related AccessToken entries");

                    return AccessToken.destroy({
                        where: {
                            validUntil: {
                                $lt: SEQUELIZE.fn("NOW"),
                                $ne: null
                            }
                        }
                    });
                }
            }
        });

    return AccessToken;
}

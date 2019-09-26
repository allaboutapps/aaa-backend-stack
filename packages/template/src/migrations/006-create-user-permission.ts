import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.createTable("UserPermissions", {
            UserUid: {
                type: SEQUELIZE.UUID,
                primaryKey: true,
                references: {
                    model: "Users",
                    key: "uid"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            PermissionUid: {
                type: SEQUELIZE.UUID,
                primaryKey: true,
                references: {
                    model: "Permissions",
                    key: "uid"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            createdAt: {
                type: SEQUELIZE.DATE,
                allowNull: false
            },
            updatedAt: {
                type: SEQUELIZE.DATE,
                allowNull: false
            }
        });
    },

    down: async function (queryInterface, SEQUELIZE) {
        await queryInterface.dropTable("UserPermissions");
    }
};

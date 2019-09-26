import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.createTable("PasswordResetTokens", {
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
        await queryInterface.dropTable("PasswordResetTokens");
    }
};

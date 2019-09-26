import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.createTable("PushTokens", {
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
        await queryInterface.dropTable("PushTokens");
    }
};

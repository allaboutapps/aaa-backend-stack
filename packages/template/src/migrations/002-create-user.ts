import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.createTable("Users", {
            uid: { // public visible uid in apps
                type: SEQUELIZE.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: SEQUELIZE.UUIDV4
            },
            username: {
                type: SEQUELIZE.STRING,
                allowNull: true, // optional (guest users don't have an username, username is for password authentication only)
                unique: true // must be unique if set
            },
            password: {
                type: SEQUELIZE.STRING(2048)
            },
            salt: {
                type: SEQUELIZE.STRING(2048)
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
            isActive: {
                type: SEQUELIZE.BOOLEAN,
                defaultValue: true
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
        await queryInterface.dropTable("Users");
    }
};

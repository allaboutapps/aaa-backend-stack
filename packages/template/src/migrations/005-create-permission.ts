import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.createTable("Permissions", {
            uid: { // public visible uid in apps
                type: SEQUELIZE.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: SEQUELIZE.UUIDV4
            },
            scope: {
                type: SEQUELIZE.STRING,
                allowNull: false,
                unique: true // permission must be unique across the
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
        await queryInterface.dropTable("Permissions");
    }
};

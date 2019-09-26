import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.createTable("AppUserProfiles", {
            UserUid: {
                type: SEQUELIZE.UUID,
                primaryKey: true, // the foreign key of the User is the primary key of the AppUserProfile
                allowNull: false,
                references: {
                    model: "Users",
                    key: "uid"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            hasGDPROptOut: {
                type: SEQUELIZE.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            legalAcceptedAt: {
                type: SEQUELIZE.DATE,
                allowNull: true,
                defaultValue: null
            },
            // ... your custom fields ...
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
        await queryInterface.dropTable("AppUserProfiles");
    }
};

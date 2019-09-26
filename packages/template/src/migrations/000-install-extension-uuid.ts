import { IMigration } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
    },

    down: async function (queryInterface, SEQUELIZE) {
        await queryInterface.sequelize.query("DROP EXTENSION IF EXISTS \"uuid-ossp\";");
    }
};

import { IMigration, Query } from "@aaa-backend-stack/storage";

// tslint:disable-next-line:no-object-literal-type-assertion
module.exports = <IMigration>{
    up: async function (queryInterface, SEQUELIZE) {
        await queryInterface.sequelize.query(Query.createSequence("healthcheck_seq"));
    },

    down: async function (queryInterface, SEQUELIZE) {
        await queryInterface.sequelize.query(Query.dropSequence("healthcheck_seq"));
    }
};

import * as Sequelize from "sequelize";

export interface IMigration {
    executeInTransaction?: boolean; // defaults to true;
    up(queryInterface: Sequelize.QueryInterface, Sequelize: Sequelize.SequelizeStatic): Promise<any | void>;
    down(queryInterface: Sequelize.QueryInterface, Sequelize: Sequelize.SequelizeStatic): Promise<any | void> | any;
}

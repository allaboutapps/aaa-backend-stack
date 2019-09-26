import * as Sequelize from "sequelize";
import * as GQLS from "graphql-sequelize";

// bindings must be initialized by the initalizer function
let relayBindings: GQLS.RelaySequelizeNodeInterfaceConfig | null = null;

export function initializeRelaySequelizeBindings(sequelize: Sequelize.Sequelize) {
    relayBindings = GQLS.relay.sequelizeNodeInterface(sequelize);
}

export function get(): GQLS.RelaySequelizeNodeInterfaceConfig {
    if (relayBindings === null) {
        throw new Error("relayBindings.get: unable to get, not initialized yet.");
    }
    return relayBindings;
}

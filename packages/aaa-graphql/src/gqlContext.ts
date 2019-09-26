import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql");

import * as Sequelize from "sequelize";
import * as GQLS from "graphql-sequelize";

import Cache from "./internals/Cache";
import * as relayBindings from "./internals/relayBindings";
import { getDefaultTypeMapper } from "./customGraphQLScalars";

let cache: Cache;

export function initialize(sequelize: Sequelize.Sequelize, typeMapper: (type: any) => any = getDefaultTypeMapper()): void {

    logger.trace("gqlContext.initialize: invalidating typemapper...");

    // Sequelize types to Graphql mapper defaults (used through attributeFields)
    GQLS.typeMapper.mapType((type: any) => {
        return typeMapper(type);
    });

    logger.trace("gqlContext.initialize: building cache...");
    cache = new Cache();

    logger.trace("gqlContext.initialize: setting up relay bindings...");
    relayBindings.initializeRelaySequelizeBindings(sequelize);

    logger.debug("gqlContext initialized");
}

export function getRelay(): GQLS.RelaySequelizeNodeInterfaceConfig {
    return relayBindings.get();
}

export function getCache(): Cache {
    return cache;
}

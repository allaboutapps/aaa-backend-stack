import * as Sequelize from "sequelize";
import * as GQLS from "graphql-sequelize";
import { GraphQLScalarType } from "graphql";

import GraphQLUUID from "./scalars/GraphQLUUID";
import GraphQLDateTime from "./scalars/GraphQLDateTime";

// helper util to resove customly define scalars and inject them into the graphql sequelize context
const CUSTOM_SCALARS = {
    GraphQLUUID,
    GraphQLDateTime,
    SequelizeJSONType: GQLS.JSONType.default // via graphql-sequelize
};

// see https://github.com/mickhansen/graphql-sequelize#providing-custom-types
export function getDefaultTypeMapper() {
    return function (type: any) {
        if (type instanceof Sequelize.DATE) {
            // map date to custom ISO GraphQLDateTime type
            return GraphQLDateTime;
        } else if (type instanceof (Sequelize as any).UUID || type instanceof (Sequelize as any).UUIDV4) {
            // map UUID to custom GraphQLUUID type
            return GraphQLUUID;
        }

        // use default for everything else
        return false;
    };
}

export default CUSTOM_SCALARS;

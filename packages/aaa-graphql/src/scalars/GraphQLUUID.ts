import { GraphQLScalarType } from "graphql";
import { GraphQLError } from "graphql/error";
import { Kind } from "graphql/language";
import * as _ from "lodash";

import { INVALID_UUID, getFormattedErrorDescription } from "../internalErrors";

// "all" PATTERN via https://github.com/chriso/validator.js/blob/master/src/lib/isUUID.js
const PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isUUID(value: any): boolean {

    if (_.isString(value) === false || PATTERN.test(value) === false) {
        return false;
    }

    return true;
}

function parseUUID<T>(value: T): T {

    if (isUUID(value) === false) {
        throw new INVALID_UUID({
            parseError: "Field error: value is not a valid UUID"
        });
    }

    return value;
}

export default new GraphQLScalarType({
    name: "UUID",
    description: `A special custom Scalar type for UUID (all versions) that directly converts to String${getFormattedErrorDescription(INVALID_UUID)}`,
    serialize: (value) => value,
    parseValue: parseUUID,
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
            throw new INVALID_UUID({
                parseError: "Query error: Can only parse String to UUID but got a: " + ast.kind
            });
        }

        return parseUUID(ast.value);
    }
});

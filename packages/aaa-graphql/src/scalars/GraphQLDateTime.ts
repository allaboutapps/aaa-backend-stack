// via https://github.com/Yoctol/graphql-custom-datetype/blob/master/datetype.js (not published yet)
import { GraphQLScalarType } from "graphql";
import { GraphQLError } from "graphql/error";
import { Kind } from "graphql/language";

import { INVALID_GRAPHQL_DATE_TIME, getFormattedErrorDescription } from "../internalErrors";

function coerceDate(value: any): any {

    if (typeof value === "string") {
        // tslint:disable-next-line:aaa-no-new-date
        return coerceDate(new Date(value));
    }

    if (!(value instanceof Date)) {
        // Is this how you raise a "field error"?
        throw new INVALID_GRAPHQL_DATE_TIME({
            parseError: "Field error: value is not an instance of Date"
        });
    }
    if (isNaN(value.getTime())) {
        throw new INVALID_GRAPHQL_DATE_TIME({
            parseError: "Field error: value is an invalid Date"
        });
    }
    return value.toJSON();
}

export default new GraphQLScalarType({
    name: "DateTime",
    description: `A special custom Scalar type for Dates that converts to a ISO 8601 formatted String (YYYY-MM-DDTHH:mm:ss.sssZ)${getFormattedErrorDescription(INVALID_GRAPHQL_DATE_TIME)}`,
    serialize: coerceDate,
    parseValue: coerceDate,
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
            throw new INVALID_GRAPHQL_DATE_TIME({
                parseError: "Query error: Can only parse String to Date but got a: " + ast.kind
            });
        }

        // tslint:disable-next-line:aaa-no-new-date
        const result = new Date(ast.value);
        if (isNaN(result.getTime())) {
            throw new INVALID_GRAPHQL_DATE_TIME({
                parseError: "Query error: Invalid Date"
            });
        }
        if (ast.value !== result.toJSON()) {
            throw new INVALID_GRAPHQL_DATE_TIME({
                parseError: "Query error: Invalid Date format, only accepts: YYYY-MM-DDTHH:mm:ss.sssZ"
            });
        }
        return result;
    }
});

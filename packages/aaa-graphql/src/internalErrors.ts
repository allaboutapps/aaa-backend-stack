import * as _ from "lodash";
import { createError, IApolloErrorConstructor } from "apollo-errors";

export const ENTITY_NOT_FOUND = createError("ENTITY_NOT_FOUND", {
    message: "The referenced entity was not found"
});

export const INVALID_GRAPHQL_DATE_TIME = createError("INVALID_GRAPHQL_DATE_TIME", {
    message: "The supplied date time could not be parsed"
});

export const INVALID_UUID = createError("INVALID_UUID", {
    message: "The supplied uuid could not be parsed"
});

export function getFormattedErrorsDescription(errors: { [error: string]: IApolloErrorConstructor }): string {

    if (_.isObject(errors) === false) {
        return "";
    }

    return _.reduce(_.values(errors), (sum, error: IApolloErrorConstructor) => {
        sum += getFormattedErrorDescription(error);
        return sum;
    }, "");

}

export function getFormattedErrorDescription(error: IApolloErrorConstructor): string {
    return `\nMight throw '${getErrorName(error)}'.`;
}

export function getErrorName(error: IApolloErrorConstructor): string {
    return new error().name;
}


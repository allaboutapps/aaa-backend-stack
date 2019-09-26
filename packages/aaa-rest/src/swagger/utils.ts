import * as _ from "lodash";
import { BoomError, create as createBoomError } from "boom";
import * as Joi from "joi";

import { IStatusCodeDefinition, BoomErrorFn } from "../base/IStatusCodeDefinition";

export function explicitlySetDefaultAuthStrategy(sugaredRoute: any) {
    if (_.isObject(sugaredRoute.config.auth)) {
        sugaredRoute.config.auth.strategy = "default-authentication-strategy";
    } else {
        sugaredRoute.config.auth = "default-authentication-strategy";
    }

    sugaredRoute.config.notes = "@authenticated: Needs 'authorization': 'Bearer XXX' set in Header (uses default-authentication-strategy)\n\n" + (_.isEmpty(sugaredRoute.config.notes) ? "" : sugaredRoute.config.notes);
}

function buildBoomErrorSchema(statusCode: number, error: string | string[] = null, message: string | string[] = null, errorType: string | string[] = null) {
    return Joi.object().required().keys({
        "statusCode": Joi.number().required().allow(statusCode).example(statusCode),
        ...(error === null ? {} : {
            "error": Joi.string().allow(error).example(_.isArray(error) ? error[0] : error)
        }),
        ...(message === null ? {} : {
            "message": Joi.string().allow(message).example(_.isArray(message) ? message[0] : message)
        }),
        ...(errorType === null ? {} : {
            "errorType": Joi.string().optional().allow(errorType).example(_.isArray(errorType) ? errorType[0] : errorType)
        })
    }).description("Boom JSON Error");
}

export type SwaggerStatusCode = IStatusCodeDefinition | BoomErrorFn | BoomError;

export interface ISwaggerResponseBody {
    description: string;
    schema: Joi.Schema;
}

export interface ISwaggerResponse {
    code: number;
    body: ISwaggerResponseBody;
}

// helper function to document statuscodes via the hapi-swagger plugin...
export function getSwaggerStatusResponses(statusCodes: SwaggerStatusCode[]) {

    const mappedStatusCodes: { [httpStatusCode: number]: SwaggerStatusCode[] } = {};

    _.each(statusCodes, (statusCode) => {
        const httpStatusCode = getHttpStatusCode(statusCode);
        if (_.isNil(mappedStatusCodes[httpStatusCode])) {
            mappedStatusCodes[httpStatusCode] = [];
        }

        mappedStatusCodes[httpStatusCode].push(statusCode);
    });

    const statusCodeMap: { [httpStatusCode: number]: ISwaggerResponseBody } = {};

    _.each(_.keys(mappedStatusCodes), (httpStatusCode: number) => {
        statusCodeMap[httpStatusCode] = getAbstractFormattedSwaggerResponse(mappedStatusCodes[httpStatusCode]).body;
    });

    return statusCodeMap;
}

export function getHttpStatusCode(statusCode: SwaggerStatusCode): number {
    if (statusCode instanceof Function) {
        // BoomError!
        const StatusCodeBoom = statusCode as BoomErrorFn;
        const boomError = StatusCodeBoom();

        return boomError.output.statusCode;
    } else if (statusCode instanceof Error) {
        const boomError = statusCode as BoomError;

        return boomError.output.statusCode;
    } else {
        // IStatusCodeDefinition!
        const statusCodeDef = statusCode as IStatusCodeDefinition;
        const boomError = createBoomError(statusCodeDef.code, statusCodeDef.message);

        return boomError.output.statusCode;
    }
}

export function getAbstractFormattedSwaggerResponse(statusCodeOrCodes: SwaggerStatusCode | SwaggerStatusCode[]): ISwaggerResponse {
    const statusCodes = _.isArray(statusCodeOrCodes) ? statusCodeOrCodes : [statusCodeOrCodes];

    let httpStatusCode: number;
    const descriptions: string[] = [];
    const errors: string[] = [];
    const messages: string[] = [];
    const errorTypes: string[] = [];

    _.each(statusCodes, (statusCode) => {
        if (statusCode instanceof Function) {
            // BoomError!
            const StatusCodeBoom = statusCode as BoomErrorFn;
            const boomError = StatusCodeBoom();

            httpStatusCode = boomError.output.statusCode;

            descriptions.push(boomError.message);
            errors.push(boomError.output.payload.error);
            messages.push(boomError.message);
        } else if (statusCode instanceof Error) {
            const boomError = statusCode as BoomError;

            httpStatusCode = boomError.output.statusCode;

            descriptions.push(boomError.message);
            errors.push(boomError.output.payload.error);
            messages.push(boomError.message);
        } else {
            // IStatusCodeDefinition!
            const statusCodeDef = statusCode as IStatusCodeDefinition;
            const boomError = createBoomError(statusCodeDef.code, statusCodeDef.message);

            httpStatusCode = boomError.output.statusCode;

            descriptions.push(`${boomError.message} (\`${_.isNil(statusCodeDef.errorType) ? "generic" : statusCodeDef.errorType}\`)`);
            errors.push(boomError.output.payload.error);
            messages.push(boomError.message);
            errorTypes.push(_.isNil(statusCodeDef.errorType) ? "generic" : statusCodeDef.errorType);
        }
    });

    return {
        code: httpStatusCode,
        body: {
            description: _.uniq(descriptions).join("  \n\n"),
            schema: buildBoomErrorSchema(
                httpStatusCode,
                _.uniq(errors).filter(e => e !== "Unknown"),
                _.uniq(messages),
                _.isEmpty(errorTypes) ? null : _.uniq(errorTypes)
            )
        }
    };
}

export interface ISwaggerSecurityDefinitionObjectOptions {
    includeBearerSecurityStrategyName: string;
    includeBasicAuthSecurityStrategyName: string;
}

export function getSwaggerSecurityDefinitionObject(options: Partial<ISwaggerSecurityDefinitionObjectOptions>): object {

    const security = _.map(options, (value, key) => {
        return {
            [key]: []
        };
    });

    return {
        securityDefinitions: {
            ...(options.includeBearerSecurityStrategyName ? {
                [options.includeBearerSecurityStrategyName]: {
                    type: "apiKey",
                    name: "Authorization",
                    in: "header",
                    "x-keyPrefix": "Bearer "
                }
            } : {}),
            ...(options.includeBasicAuthSecurityStrategyName ? {
                [options.includeBasicAuthSecurityStrategyName]: {
                    type: "basic"
                }
            } : {}),
        },
        security
    };
}

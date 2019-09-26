import setRoute from "../internals/setRoute";
import { getSwaggerStatusResponses } from "../swagger/utils";
import { IStatusCodeDefinition, BoomErrorFn } from "../base/IStatusCodeDefinition";
import { BoomError } from "boom";
import * as _ from "lodash";

export interface IMinimalRouteDefinition {
    description: string;
    notes?: string;
    statusCodes?: (IStatusCodeDefinition | BoomErrorFn | BoomError)[];
    tags?: string[];
}

/**
 * Appends statusCodes for swagger documentation
 */
export function statusCodes(statusCodes: (IStatusCodeDefinition | BoomErrorFn | BoomError)[]): MethodDecorator {
    return function (target, key, descriptor) {

        setRoute(target, key as any, {
            config: {
                plugins: {
                    "hapi-swagger": {
                        responses: getSwaggerStatusResponses(statusCodes)
                    }
                }
            }
        });

        return descriptor;
    };
}

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
 * Appends 'description, notes and status codes for swagger' to a route definition
 */
export function documentation(config: IMinimalRouteDefinition, exposeInSwagger: boolean = true): MethodDecorator {
    return function (target, key, descriptor) {

        setRoute(target, key as any, {
            config: {
                description: config.description,
                notes: config.notes,
                tags: config.tags ? (exposeInSwagger ? _.union(["api"], config.tags) : config.tags) : (exposeInSwagger ? ["api"] : []), // expose to swagger
                // conditionally add statuscodes
                ...(config.statusCodes ? {
                    plugins: {
                        "hapi-swagger": {
                            responses: getSwaggerStatusResponses(config.statusCodes)
                        }
                    }
                } : {})
            }
        });

        return descriptor;
    };
}

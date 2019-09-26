import setRoute from "../internals/setRoute";
import { RouteResponseConfigurationObject } from "hapi";

/**
 * Apply serverside validation to response payload, errors out with 500 on schema errors
 */
export function response(responseConfig: RouteResponseConfigurationObject): MethodDecorator {
    return function (target, key, descriptor) {

        setRoute(target, <string>key, {
            config: {
                response: responseConfig
            }
        });

        return descriptor;
    };
}

import * as _ from "lodash";
import { BoomError } from "boom";

import logDeprecatedRouteHandler from "../base/logDeprecatedRouteHander";
import { IStatusCodeDefinition, BoomErrorFn } from "../base/IStatusCodeDefinition";

import {
    explicitlySetDefaultAuthStrategy,
    getAbstractFormattedSwaggerResponse
} from "./utils";

import {
    Request as IHapiRequest,
    Response as IHapiResponse,
    ReplyWithContinue as IHapiReply,
    RouteConfiguration,
    RouteAdditionalConfigurationOptions
} from "hapi";

export interface ISugaredRoutesOptions {
    routes: RouteConfiguration[];
    defaultRoutesStatusCodes?: (IStatusCodeDefinition | BoomErrorFn | BoomError)[];
    defaultSecuredStatusCodes?: (IStatusCodeDefinition | BoomErrorFn | BoomError)[];
    explicitlySetDefaultAuthStrategy?: boolean; // defaults to true
}

/** 
 * add some sugar to the routes description string (e.g. about required permission scope, ...)
 * auto add the required permission scope definitions to the route description (useful for logging and hapi-swagger display)
 */
export function sugarRoutes(options: ISugaredRoutesOptions) {
    return _.map(options.routes, (route) => {

        let sugaredRoute = route;

        if (typeof sugaredRoute.config === "function") {
            throw new SyntaxError("route.config () => RouteAdditionalConfigurationOptions arrow function definition is currently not supported.");
        }

        const { auth, description } = sugaredRoute.config;

        if (!description) {
            sugaredRoute.config.description = "No route description supplied";
        }

        //  these status codes will be returned by any endpoint (useful for swagger auto ducumentation)...
        sugaredRoute.config.plugins = _.defaultsDeep(sugaredRoute.config.plugins, {
            "hapi-swagger": {
                responses: _.reduce(options.defaultRoutesStatusCodes, (sum, statusCode) => {

                    const swaggerStatusResponse = getAbstractFormattedSwaggerResponse(statusCode);

                    return {
                        ...sum,
                        [swaggerStatusResponse.code]: swaggerStatusResponse.body
                    };
                }, {})
            }
        });

        if (auth !== false) {
            sugaredRoute.config.description += ` | @authenticated`; // signal that this endpoint is for authenticated users only
            if (auth
                && auth !== true // help typescript inference
                && typeof auth !== "string" // help typescript inference
                && auth.scope) {
                sugaredRoute.config.description += ` [${auth.scope}]`; // add the definied permission scopes

                if (options.explicitlySetDefaultAuthStrategy !== false
                    && _.isEmpty((auth as any).strategy) === true // only here for backwards compability
                    && _.isEmpty(auth.strategies) === true) {

                    explicitlySetDefaultAuthStrategy(sugaredRoute);
                }

            } else {
                sugaredRoute.config.description += ` [*]`; // signal that all permission scopes are allowed.
                if (options.explicitlySetDefaultAuthStrategy !== false
                    && _.isEmpty(auth) === true) {

                    explicitlySetDefaultAuthStrategy(sugaredRoute);
                }
            }

            // these status codes will be returned by any endpoint that is flagged as authorized (useful for swagger auto ducumentation)...
            sugaredRoute.config.plugins = _.defaultsDeep(sugaredRoute.config.plugins, {
                "hapi-swagger": {
                    responses: _.reduce(options.defaultSecuredStatusCodes, (sum, statusCode) => {

                        const swaggerStatusResponse = getAbstractFormattedSwaggerResponse(statusCode);
                        return {
                            ...sum,
                            [swaggerStatusResponse.code]: swaggerStatusResponse.body
                        };
                    }, {})
                }
            });

        }

        // add deprecated warning handlers to depracted routes (signaled through the hapi-swagger depracated boolean flag)
        if (sugaredRoute.config.plugins
            && sugaredRoute.config.plugins["hapi-swagger"]
            && sugaredRoute.config.plugins["hapi-swagger"].deprecated === true) {

            sugaredRoute.config.description = `[DEPRECATED] ` + sugaredRoute.config.description;
            sugaredRoute.handler = logDeprecatedRouteHandler(sugaredRoute.handler, sugaredRoute.path, sugaredRoute.method);
        }

        return sugaredRoute;
    });
}

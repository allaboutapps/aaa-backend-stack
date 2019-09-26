import { RouteAdditionalConfigurationOptions } from "hapi";

import setRoute from "../internals/setRoute";

/**
 * Enforces a specific authentication strategy or scope
 */
export function auth(authConfig: {
    /**  the authentication mode.Defaults to 'required' if a server authentication strategy is configured, otherwise defaults to no authentication.Available values:
         'required'authentication is required.
         'optional'authentication is optional (must be valid if present).
         'try'same as 'optional' but allows for invalid authentication. */
    mode?: string;
    /**  a string array of strategy names in order they should be attempted.If only one strategy is used, strategy can be used instead with the single string value.Defaults to the default authentication strategy which is available only when a single strategy is configured.  */
    strategies?: string | Array<string>;
    /**  if set, the payload (in requests other than 'GET' and 'HEAD') is authenticated after it is processed.Requires a strategy with payload authentication support (e.g.Hawk).Cannot be set to a value other than 'required' when the scheme sets the options.payload to true.Available values:
     falseno payload authentication.This is the default value.
     'required'payload authentication required.This is the default value when the scheme sets options.payload to true.
     'optional'payload authentication performed only when the client includes payload authentication information (e.g.hash attribute in Hawk). */
    payload?: string;
    /**  the application scope required to access the route.Value can be a scope string or an array of scope strings.The authenticated credentials object scope property must contain at least one of the scopes defined to access the route.Set to false to remove scope requirements.Defaults to no scope required.  */
    scope?: string | Array<string> | boolean;
    /** the required authenticated entity type.If set, must match the entity value of the authentication credentials.Available values:
     anythe authentication can be on behalf of a user or application.This is the default value.
     userthe authentication must be on behalf of a user.
     appthe authentication must be on behalf of an application. */
    entity?: string;
    /**
     * an object or array of objects specifying the route access rules. Each rule is evaluated against an incoming
     * request and access is granted if at least one rule matches. Each rule object must include at least one of:
     */
    access?: RouteAdditionalConfigurationOptions | RouteAdditionalConfigurationOptions[];
}): MethodDecorator {
    return function (target, key, descriptor) {

        setRoute(target, key as any, {
            config: {
                auth: authConfig
            }
        } as any);

        return descriptor;
    };
}

/**
 * Applies 'auth: false' to a route definition (typically you should setup your server to require auth for all routes by default!)
 */
export const noAuth = function (target, key, descriptor) {

    setRoute(target, key, {
        config: {
            auth: false,
        }
    });

    return descriptor;
};

/**
 * Enforces a specific authentication scope only (e.g. only "cms" scope)
 */
export function authScope(scope: string | Array<string> | boolean): MethodDecorator {
    return function (target, key, descriptor) {

        setRoute(target, key as any, {
            config: {
                auth: {
                    scope
                }
            }
        } as any);

        return descriptor;
    };
}

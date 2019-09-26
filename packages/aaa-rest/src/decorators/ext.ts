import { Request, ReplyWithContinue, Response } from "hapi";

import setRoute from "../internals/setRoute";

export type IHapiHandler = (request: Request, reply: ReplyWithContinue) => Response;

export interface IHapiExtension {
    method: IHapiHandler;
}

export interface IHapiRouteExtConfiguration {
    onPreAuth: IHapiExtension[];
    onPostAuth: IHapiExtension[];
    onPreHandler: IHapiExtension[];
    onPostHandler: IHapiExtension[];
    onPreResponse: IHapiExtension[];
}

/**
 * Apply extensions to a route configuration
 * @param extConfig 
 */
export function ext(extConfig: Partial<IHapiRouteExtConfiguration>): MethodDecorator {
    return function (target, key, descriptor) {

        setRoute(target, <string>key, {
            config: {
                ext: extConfig
            }
        } as any);

        return descriptor;
    };
}

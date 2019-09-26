import * as _ from "lodash";

import {
    RouteConfiguration
} from "hapi";

// for logging information only...
export function getRoutesInfo(routes: RouteConfiguration[]) {
    return _.reduce(routes, (sum, route) => {
        const { path, config, method } = route;
        return {
            ...sum,
            [_.toUpper(method as string) + " " + path]: typeof config === "function" ? "dynamic description body" : config.description
        };
    }, {});
}

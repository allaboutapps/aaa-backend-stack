import {
    Controller
} from "hapi-decorators";

import {
    RouteConfiguration
} from "hapi";

/**
 * Controller that accepts static route configuration objects (no decorators should be applied, no need for extentions)
 */
export class StaticController implements Controller {
    baseUrl: string;
    routeConfigurationObjects = [];

    constructor(_routeConfigurationObjects: RouteConfiguration[]) {
        this.routeConfigurationObjects = _routeConfigurationObjects;
    }

    routes() {
        return this.routeConfigurationObjects;
    }
}

import * as _ from "lodash";
import { RouteConfiguration } from "hapi";

// reused from https://github.com/knownasilya/hapi-decorators/blob/master/index.js
// attention: jquery extend === lodash.merge (deep object mutation of the source object is needed)!
/**
 * 
 * @param target The BaseController
 * @param key the method (handler) in the BaseController
 * @param value the values to merge into the route configuration object
 */
export default function setRoute(target: any, key: string, value: Partial<RouteConfiguration>) {
    if (!target.rawRoutes) {
        target.rawRoutes = [];
    }

    let targetName = target.constructor.name; // ClassName
    let routeId = targetName + "." + key; // key --> methodName
    let defaultRoute = {
        config: {
            id: routeId
        }
    };

    let found = _.find(target.rawRoutes, (route: RouteConfiguration) => {
        return ((route.config as any).id) === routeId;
    });

    if (found) {
        _.merge(found, value);
    } else {
        target.rawRoutes.push(_.merge(defaultRoute, value));
    }
}

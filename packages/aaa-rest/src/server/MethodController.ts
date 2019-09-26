import {
    Controller
} from "hapi-decorators";

import { RouteConfiguration } from "hapi";

/**
 * Controller that should be extended with own method handler implementations (decorators can be applied)
 */
export class MethodController implements Controller {
    baseUrl: string; // auto-injected via hapi-decorators
    routes: () => RouteConfiguration[]; // auto-injected via hapi-decorators
}

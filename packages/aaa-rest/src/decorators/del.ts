import { route } from "hapi-decorators";

/**
 * DELETE method: http route path definition 
 */
export function del(path: string): MethodDecorator {
    return route("DELETE", path);
}

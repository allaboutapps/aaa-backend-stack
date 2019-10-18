import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/rest");

import { TRAVERSE, GLOB_PROMISE } from "@aaa-backend-stack/utils";
import * as path from "path";
import { MethodController } from "./MethodController";
import { StaticController } from "./StaticController";
import * as _ from "lodash";

import { RouteConfiguration } from "hapi";

export async function loadControllersByGlob(pattern: string, cwd: string): Promise<Array<RouteConfiguration[]>> {
    const controllerFiles = await GLOB_PROMISE(pattern, { cwd });

    logger.debug({
        controllerFiles,
        pattern,
        cwd
    }, "loadControllersByGlob: will require these controllers...");

    const controllers: Array<RouteConfiguration[]> = _.reduce(controllerFiles, (sum, controllerFile) => {

        const controllerPath = path.resolve(cwd, controllerFile);
        logger.trace({
            controllerPath
        }, "loadControllersByGlob: requiring...");
        const controller = require(controllerPath);

        if (controller.default instanceof MethodController
            || controller.default instanceof StaticController) {

            sum.push(controller.default.routes());
            return sum;
        }

        console.warn("@aaa-backend-stack/rest.loadControllersByGlob:" + controllerPath + " is not a valid MethodController or StaticController, ignored...");
        return sum;

    }, [] as Array<RouteConfiguration[]>);

    return controllers;
}

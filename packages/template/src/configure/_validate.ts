// ensures ownership of 3rd party packages was not violated by a package.json service configuration
import * as _ from "lodash";

import logger from "@aaa-backend-stack/logger";

export function validatePackageOwnership(pkg: any, throwOnError: boolean = true) {
    // auto-require all defined package __OWNS__ infos (exposed through the .__OWNS__ array in all of our own packages)
    const ALL_ROOT_DEPENDENCIES = {
        ...pkg.devDependencies,
        ...pkg.dependencies
    };

    const collisions: any[] = [];

    _.each(ALL_ROOT_DEPENDENCIES, (version: any, stackDependency: any) => {
        if (stackDependency.indexOf("@aaa-backend-stack/") !== -1) {
            // tslint:disable-next-line:non-literal-require
            const dep = require(stackDependency);

            if (dep.__OWNS__) {
                _.each(dep.__OWNS__, (pkgOwnedDependency: any) => {
                    if (ALL_ROOT_DEPENDENCIES[pkgOwnedDependency]) {

                        // capture found collision!
                        // tslint:disable-next-line:max-line-length
                        collisions.push(`${pkgOwnedDependency}@v${ALL_ROOT_DEPENDENCIES[pkgOwnedDependency]} is owned by ${stackDependency} and thus not allowed to be directly required by this project.`);
                    }
                });
            }
        }
    });

    if (collisions.length > 0) {
        logger.fatal({
            collisions: collisions.sort()
        }, "configure._validate: Package ownership is broken. Remove these packages from this service! They are owned and controlled by a @aaa-backend-stack/* package!");

        if (throwOnError) {
            throw new Error(collisions.join("\n"));
        }

        return;
    }

    logger.debug("configure._validate: Package ownership validated, no collisions were found.");
}

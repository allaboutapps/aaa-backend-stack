/**
 * Command to update all @aaa- npm packages in a project
 */
import * as _ from "lodash";
import * as path from "path";

import { execAsync } from "@aaa-backend-stack/utils";
import { defineCLIEnvironment, CLI, FS_EXTRA, SEMVER } from "@aaa-backend-stack/build-tools";
import { createProjectDirectory, localSetup, remoteSetup } from "../setup";
import { ICabgenEnvironment, getCabgenEnvironment, applyCabgenTemplates, saveCabgenEnvironment, expandCabgenDirectories } from "../cabgen";
import { setupProjectThroughDocker } from "../docker";

const packageNamePrefix = "@aaa-backend-stack/";

export const updateAaaPackages = async (parsedArgs) => {
    const packageJsonPath = path.resolve("package.json");
    const packageJsonExists = await FS_EXTRA.pathExists(packageJsonPath);
    if (!packageJsonExists) {
        CLI.error(`No package.json found (${packageJsonPath})`);
        return;
    }

    // Load package.json into object
    CLI.debug(`package.json found: ${packageJsonPath}`);
    const packageJson = await FS_EXTRA.readJson(packageJsonPath);

    // Exract aaa dependencies
    const aaaDependencies = [];
    _.each(packageJson.dependencies, (currentVersion, packageName) => {
        if (packageName.substr(0, 19) === packageNamePrefix) {
            aaaDependencies.push(packageName);
        }
    });

    // Exract aaa dev-dependencies
    const aaaDevDependencies = [];
    _.each(packageJson.devDependencies, (currentVersion, packageName) => {
        if (packageName.substr(0, 19) === packageNamePrefix) {
            aaaDevDependencies.push(packageName);
        }
    });

    if (aaaDependencies.length > 0) {
        CLI.info("Upgrading dependencies...");
        for (let i = 0; i < aaaDependencies.length; i++) {
            CLI.info("- " + aaaDependencies[i]);
            await execAsync(`yarn upgrade ${aaaDependencies[i]} --latest`);
        }
    }

    if (aaaDevDependencies.length > 0) {
        CLI.info("Upgrading devDependencies...");
        for (let i = 0; i < aaaDevDependencies.length; i++) {
            CLI.info("- " + aaaDevDependencies[i]);
            await execAsync(`yarn upgrade ${aaaDevDependencies[i]} --latest`);
        }
    }

    CLI.info(`🚀  done`);
};

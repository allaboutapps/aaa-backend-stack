#!/usr/bin/env node
{
    process.env.HIDE_AAA_BUILD_TOOLS_INFO = "true";
    process.env.HIDE_AAA_POLYFILLS_INFO = "true";
}

import "@aaa-backend-stack/polyfills";
import { defineCLIEnvironment, CLI, FS_EXTRA, SEMVER } from "@aaa-backend-stack/build-tools";
import * as inquirer from "inquirer";
import * as path from "path";
import * as _ from "lodash";
import { execAsync, GLOB_PROMISE } from "@aaa-backend-stack/utils";
import * as childProcess from "child_process";
import { createProjectDirectory, localSetup, remoteSetup } from "./setup";
import { ICabgenEnvironment, getCabgenEnvironment, applyCabgenTemplates, saveCabgenEnvironment, expandCabgenDirectories } from "./cabgen";
import { setupProjectThroughDocker } from "./docker";
import { scaffold } from "./commands/scaffold";
import { updateAaaPackages } from "./commands/update-aaa-packages";

const generatorPkg = require("../package.json");

// tslint:disable-next-line:no-floating-promises
defineCLIEnvironment({
    name: `create-aaa-backend`,
    version: generatorPkg.version,
    args: {
        useBranch: ["b", "checkout a specific remote branch to generate the template project from (by default the template associated with the latest stable tag will be checked out)", "string", null],
        yesToAll: ["y", "don't ask any questions, simply assume the default values"],
        noDocker: ["x", "don't try to build and test project via docker if installed"],
        panicOnDockerSetupError: ["p", "panic on docker setup encountered error (useful for ci)"],
        local: ["l", "instead of using git operations, simply copy from the local filesystem (only works through yarn create-aaa-backend inside the aaa-backend-stack monorepo)"],
        // TODO-OSS: change this to https, not ssh (else the clone might not work for users without ssh keys)
        backendStackRepo: [null, "(internal) git aaa-backend-stack monorepo", "string", "ssh://git@github.com:allaboutapps/aaa-backend-stack.git"],
        backendStackTemplate: [null, "(internal) relative path to template package in monorepo", "string", "/packages/template"],
        backendStackGenerator: [null, "(internal) relative path to create-aaa-backend package in monorepo", "string", "/packages/create-aaa-backend"],
    },
    commands: {
        "scaffold": scaffold,
        "update-aaa-packages": updateAaaPackages
    }
});


import * as inquirer from "inquirer";
import * as _ from "lodash";
import { defineCLIEnvironment, CLI, FS_EXTRA, SEMVER } from "@aaa-backend-stack/build-tools";
import * as path from "path";
import { execAsync, GLOB_PROMISE } from "@aaa-backend-stack/utils";

const generatorPkg = require("../package.json");

export async function createProjectDirectory(yesToAll: boolean): Promise<string> {
    const { unsafeProjectDir } = yesToAll ? { unsafeProjectDir: "aaa-backend" } : await inquirer.prompt({
        type: "input",
        name: "unsafeProjectDir",
        message: "Welcome! How should the project AND folder be named where your new aaa-backend lives in (kebab-case)?",
        default: function () {
            return "aaa-backend";
        }
    });

    const projectDir = _.kebabCase(unsafeProjectDir);

    if (_.isEmpty(_.trim(projectDir.split("_").join("")))) {
        throw new Error(`Received unsupported projectDir: "${projectDir}"`);
    }

    // ensure this directory does not exist...
    const exists = await FS_EXTRA.pathExists(projectDir);

    if (exists) {
        CLI.fatal(`Directory ./${projectDir} already exists.`);
        process.exit(1);
    }

    // create project dir
    CLI.info(`⏱️  Creating project in ./${projectDir}`);
    await FS_EXTRA.mkdir(projectDir);

    return projectDir;
}

export async function remoteSetup({
    backendStackRepo,
    backendStackTemplate,
    backendStackGenerator,
    useBranch,
    yesToAll,
    projectDir,
}): Promise<string> {
    // get a new temp dir in the workpath
    const tmpClonePath = await FS_EXTRA.mkdtemp(".aaa-");

    await cloneMonorepo({
        tmpClonePath,
        useBranch,
        backendStackRepo
    });

    // check if there is a newer version of create-aaa-backend in the checked out folder an flash a warning if this is the case!
    await warnOnOutdatedGenerator({
        backendStackGenerator,
        projectDir,
        tmpClonePath,
        yesToAll
    });

    // copy from clone target to project folder
    const templateBase = `${tmpClonePath}${backendStackTemplate}`;
    CLI.debug(`Remote Setup: Copying ./${templateBase} to ./${projectDir}...`);
    await FS_EXTRA.copy(templateBase, projectDir, {
        recursive: true
    });

    // the yarn.lock file in the root monorepo project is the single source of truth as a starting point for this new project
    // the other relevant own packages will get automatically appended to it, therefore copy and go.
    const baseYarnLock = path.join(tmpClonePath, "yarn.lock");
    CLI.debug(`Remote Setup: Copying ${baseYarnLock} to ./${projectDir}/yarn.lock...`);
    await FS_EXTRA.copy(baseYarnLock, projectDir + "/yarn.lock");

    const commit = require("child_process").execSync(`cd ${tmpClonePath} && git rev-parse HEAD`).toString().trim();

    // rm tmp clone target
    CLI.debug(`Remote Setup: Removing tmp dir ./${tmpClonePath}...`);
    await FS_EXTRA.remove(tmpClonePath);

    CLI.info(`Remote Setup: checked out aaa-backend-stack ${commit}.`);

    return commit;
}

async function warnOnOutdatedGenerator({ backendStackGenerator, tmpClonePath, projectDir, yesToAll }): Promise<void> {
    try {
        const stackGeneratorPkgPath = path.resolve(path.join(tmpClonePath, backendStackGenerator, "package.json"));
        const stackGeneratorPkg = require(stackGeneratorPkgPath);

        if (SEMVER.gt(stackGeneratorPkg.version, generatorPkg.version)) {
            const { confirmOutdatedGenerator } = yesToAll ? { confirmOutdatedGenerator: true } : await inquirer.prompt({
                type: "confirm",
                name: "confirmOutdatedGenerator",
                message: `create-aaa-backend is outdated. Your version: ${generatorPkg.version}. Latest version: ${stackGeneratorPkg.version}. Continue anyways?`,
            });

            if (confirmOutdatedGenerator === false) {
                await FS_EXTRA.remove(tmpClonePath);
                await FS_EXTRA.remove(projectDir);
                process.exit(1);
            }
        }
    } catch (e) {
        CLI.error("Warning: stackGenerator package.json was not found. Cannot check if you are running the latest version...");
        return;
    }

}

// returns the relative tmpClonePath
async function cloneMonorepo({ tmpClonePath, backendStackRepo, useBranch }) {

    const simpleGit = require("simple-git")(tmpClonePath);
    const clone: (repo: string, workdir: string, args: any[]) => Promise<any> = Promise.promisify(simpleGit.clone, { context: simpleGit });
    const pull: (remote: string, branch: string) => Promise<any> = Promise.promisify(simpleGit.pull, { context: simpleGit });
    const checkoutLatestTag: () => Promise<any> = Promise.promisify(simpleGit.checkoutLatestTag, { context: simpleGit });
    const describe: () => Promise<string> = Promise.promisify(simpleGit.raw, { context: simpleGit }).bind(simpleGit, ["describe", "--tags"]);
    const describeNotAnnotated: () => Promise<string> = Promise.promisify(simpleGit.raw, { context: simpleGit }).bind(simpleGit, ["describe", "--tags"]);

    CLI.debug(`Cloning aaa-backend-stack tag from ${backendStackRepo} to tmp dir ./${tmpClonePath}...`);
    await clone(backendStackRepo, ".", []);

    if (useBranch === null) {
        CLI.debug(`Checking out latest stable tag...`);
        await checkoutLatestTag();
    } else {
        CLI.debug(`Checking out branch ${useBranch}...`);
        await pull("origin", useBranch);
    }

    let tag;
    try {
        tag = await describe();
    } catch (err) {
        tag = await describeNotAnnotated();
    }


    CLI.info(`On ${useBranch ? "branch " + useBranch + " - " : ""}aaa-backend-stack@${tag}`);
}

export async function localSetup({ projectDir }): Promise<string> {

    const lernaJson = path.resolve(__dirname, "../../../lerna.json");
    CLI.debug(`Local setup: Checking ${lernaJson} exists...`);
    const lernaJsonExists = await FS_EXTRA.pathExists(lernaJson);

    // ensure we are within the monorepo...
    if (!lernaJsonExists) {
        throw new Error("You don't appear to operate within the monorepo");
    }

    const templateBase = path.resolve(__dirname, "../../template");

    CLI.debug(`Local setup: Copying ${templateBase} to ./${projectDir}...`);
    await FS_EXTRA.copy(templateBase, projectDir, {
        recursive: true
    });

    const baseYarnLock = path.resolve(__dirname, "../../../yarn.lock");
    CLI.debug(`Local setup: Copying ${baseYarnLock} to ./${projectDir}/yarn.lock...`);
    await FS_EXTRA.copy(baseYarnLock, projectDir + "/yarn.lock");

    const commit = require("child_process").execSync("git rev-parse HEAD").toString().trim();

    CLI.info(`Local setup: checked out aaa-backend-stack ${commit}.`);

    return commit;
}

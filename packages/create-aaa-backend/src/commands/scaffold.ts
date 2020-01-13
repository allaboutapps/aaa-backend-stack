import * as path from "path";
import { defineCLIEnvironment, CLI, FS_EXTRA, SEMVER } from "@aaa-backend-stack/build-tools";
import { createProjectDirectory, localSetup, remoteSetup } from "../setup";
import { ICabgenEnvironment, getCabgenEnvironment, applyCabgenTemplates, saveCabgenEnvironment, expandCabgenDirectories } from "../cabgen";
import { setupProjectThroughDocker } from "../docker";

export const scaffold = async (parsedArgs) => {

    const {
        backendStackRepo,
        backendStackTemplate,
        backendStackGenerator,
        useBranch,
        yesToAll,
        noDocker,
        panicOnDockerSetupError,
        local
    } = parsedArgs;

    // create the new project directory
    const projectDir = await createProjectDirectory(yesToAll);
    let commit;

    if (local) {
        commit = await localSetup({ projectDir });
    } else {
        // clone aaa-backend-stack repo
        commit = await remoteSetup({
            backendStackRepo,
            backendStackTemplate,
            backendStackGenerator,
            useBranch,
            yesToAll,
            projectDir
        });
    }

    const cabgenEnvironment = await getCabgenEnvironment(projectDir, commit, yesToAll);

    CLI.info(`Cabgen environment: ${JSON.stringify(cabgenEnvironment, null, 2)}`);

    const absolutePathToProject = path.resolve(projectDir);

    await expandCabgenDirectories(absolutePathToProject);
    await applyCabgenTemplates(absolutePathToProject, cabgenEnvironment);

    await saveCabgenEnvironment(absolutePathToProject, cabgenEnvironment);

    await setupProjectThroughDocker(projectDir, yesToAll, noDocker, panicOnDockerSetupError);

    // final setup instructions:
    // Ansible must be installed.
    // Vagrant: vagrant up && vagrant ssh
    // Inside Vagrant: cd /vagrant && yarn && yarn test
    CLI.info(`🚀  Finished setting up '${projectDir}'!

                # Vagrant:
                local$ cd ${projectDir} && vagrant up && vagrant ssh
                remote$ cd /vagrant && yarn && yarn test && yarn db migrate && yarn start

                # Docker:
                local$ cd ${projectDir} && yarn docker:up
                container$ yarn && yarn test && yarn db migrate && yarn start

                # VS Code:
                cd ${projectDir} && code .

                # Docs:
                See ${projectDir}/README*.md for further information...
                `);

    // Make docker-helper.sh executable
    CLI.exec(`chmod +x ${projectDir}/docker-helper.sh`);
};

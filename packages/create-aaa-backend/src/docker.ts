import { execAsync } from "@aaa-backend-stack/utils";
import { CLI } from "@aaa-backend-stack/build-tools";
import * as childProcess from "child_process";
import * as inquirer from "inquirer";

export async function setupProjectThroughDocker(projectDir: string, yesToAll: boolean, noDocker: boolean, panicOnDockerSetupError: boolean): Promise<void> {

    if (noDocker) {
        return;
    }

    const [stdout, stderr] = await execAsync("docker -v");

    if (stderr) {
        CLI.info("Docker is not installed on your system, skipping initial setup.");
        if (panicOnDockerSetupError) {
            throw new Error("Opps no docker?");
        }
        return;
    }

    CLI.info(stdout);

    const { confirmDockerSetup } = yesToAll ? { confirmDockerSetup: true } : await inquirer.prompt({
        type: "confirm",
        name: "confirmDockerSetup",
        message: `You have Docker installed on your system.  
Should we run the container and copy the initial "node_modules" and "build" dirs into your workdir (requires Docker 17.07+)?`,
        default: function () {
            return "Y";
        }
    });

    if (confirmDockerSetup === true) {

        await new Promise((resolve, reject) => {
            const setup = childProcess.exec(`cd ${projectDir} && make create-aaa-backend-docker-setup`);

            setup.stdout.pipe(process.stdout);
            setup.stderr.pipe(process.stdout);

            setup.on("exit", async function (code) {

                if (code.toString() !== "0") {
                    CLI.error("Process exited with code " + code.toString());
                    CLI.error("Docker setup failed!");

                    CLI.info(`🤓  Type this to retry docker project setup:

            cd ${projectDir} && make create-aaa-backend-docker-setup
            `);

                    if (panicOnDockerSetupError) {
                        reject(new Error("Panicing because of docker build error"));
                    }
                }

                resolve();
            });

        });
    }
}

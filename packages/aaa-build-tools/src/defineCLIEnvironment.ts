import * as CLI from "cli";
import * as _ from "lodash";

export interface ICLIEnvironmentOptions {
    name: string;
    version: string;
    commands: { [commandName: string]: (parsedArgs: any) => Promise<void | any> };
    args?: {
        // from CLI typings
        [long: string]: { 0: string | boolean, 1: string, 2?: string, 3?: any };
    };
}

export async function defineCLIEnvironment(options: ICLIEnvironmentOptions) {

    CLI.enable("version", "status");
    CLI.setApp(options.name, options.version);

    const parsedArgs = CLI.parse(options.args ? options.args : undefined, options.commands ? _.keys(options.commands) : undefined);

    const { command } = CLI;
    CLI.info(`executing command '${command}'...`);
    await options.commands[command](parsedArgs).catch((e) => {
        CLI.fatal("=> CLI FATAL => " + e);
        // TODO pritty print stack trace (eventually directly throw?)
        process.exit(1);
    });
    CLI.info(`command '${command}' executed successfully.`);
    process.exit(0);

}


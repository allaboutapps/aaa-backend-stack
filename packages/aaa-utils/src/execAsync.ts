import * as childProcess from "child_process";

export type stdout = string;
export type stderr = string;
export type stdoutAndStdErrorArray = [stdout, stderr];

export const execAsync: (command: string) => Promise<stdoutAndStdErrorArray> = require("bluebird").promisify(childProcess.exec, {
    multiArgs: true
});

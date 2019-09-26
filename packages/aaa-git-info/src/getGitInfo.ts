import * as _ from "lodash";

import config from "./config";

export interface IGitProjectInfo {
    short: string;
    long: string;
    branch: string;
    message: string;
    tag: string;
}

const DEFAULT_OR_UNAVAILABLE_INFO = {
    short: "N/A",
    long: "N/A",
    branch: "N/A",
    message: "N/A",
    tag: "N/A"
};

// internal helper function, only allowed to execute once with memorized return.
const collectInformation = _.once((): IGitProjectInfo => {

    if (config.enabled !== true) {
        return DEFAULT_OR_UNAVAILABLE_INFO;
    }

    const git = require("git-rev-sync"); // dynamic require

    let projectInfo: IGitProjectInfo;

    try {
        projectInfo = {
            short: git.short(),
            long: git.long(),
            branch: git.branch(),
            message: git.message(),
            tag: git.tag()
        };
    } catch (e) {
        console.error("git-info: unable to get git info");
        projectInfo = DEFAULT_OR_UNAVAILABLE_INFO;
    }

    return projectInfo;
});

export default function getGitProjectInfo(): IGitProjectInfo {
    return collectInformation();
}

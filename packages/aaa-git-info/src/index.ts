// normal public exports
export { IConfig, config } from "./config";
export { IGitProjectInfo } from "./getGitInfo";

// default public export
import getGitInfo from "./getGitInfo";
export default getGitInfo;

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "git-rev-sync"
];

import { config, IConfig as IGitConfig } from "@aaa-backend-stack/git-info";
export { IConfig as IGitConfig } from "@aaa-backend-stack/git-info";

export const gitInfo: IGitConfig = config.configure({
    enabled: process.env.AAA_GIT_INFO_ENABLED === "true"
});

import { extendWith } from "lodash";
import { ILazyConfig } from "@aaa-backend-stack/build-tools";

export interface IConfig {
    enabled: boolean;
}

let configuredOptions;
export const config: Partial<ILazyConfig<IConfig>> = {
    configure: (options) => {

        if (configuredOptions) {
            console.warn("@aaa-backend-stack/git-info was already configured, returning previous config");
            return configuredOptions;
        }

        configuredOptions = { ...options };

        extendWith(config, options);
        return options;
    }
};

export default config;

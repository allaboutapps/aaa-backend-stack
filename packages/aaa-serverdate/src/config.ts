import { ILazyConfig } from "@aaa-backend-stack/build-tools";
import { extend } from "lodash";

export interface IConfig {
    timezone: string;
}

let configuredOptions;
export const config: Partial<ILazyConfig<IConfig>> = {
    configure: (options: IConfig) => {

        if (configuredOptions) {
            console.warn("@aaa-backend-stack/serverdate was already configured, returning previous config");
            return configuredOptions;
        }

        configuredOptions = { ...options };
        extend(config, options);
        return options;
    }
};

import { config, IConfig as IServerdateConfig } from "@aaa-backend-stack/serverdate";
import { ensurePrefixedEnvironment } from "@aaa-backend-stack/utils";
export { IConfig as IServerdateConfig } from "@aaa-backend-stack/serverdate";

// migration helper: support old environment variable keys, however mark unprefixed env variables as deprecated through this helper!
const ENV_AAA_SERVERDATE = ensurePrefixedEnvironment("AAA_SERVERDATE");

export const serverdate: IServerdateConfig = config.configure({
    timezone: ENV_AAA_SERVERDATE("SERVER_TIMEZONE") || "Europe/Vienna"
});

import { getHapiLoggerPlugin } from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";

const hook: REST.SERVER.IHook = {
    async init(api) {
        await api.registerPlugin(getHapiLoggerPlugin());
    }
};

export default hook;

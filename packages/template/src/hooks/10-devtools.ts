import { getHapiDevtoolsPlugin } from "@aaa-backend-stack/devtools";
import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../configure";

const hook: REST.SERVER.IHook = {
    enabled: CONFIG.enabledHooks.devtools,

    async init(api) {

        await api.registerPlugin(getHapiDevtoolsPlugin({
            endpoint: "/devtools",
            auth: {
                strategy: "basic-authentication",
                scope: "root"
            },
            clientWelcomeMessageFn: () => {
                return api.getInstanceInfo();
            }
        }));
    }
};

export default hook;

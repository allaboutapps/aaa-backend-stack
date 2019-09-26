import * as REST from "@aaa-backend-stack/rest";
import storage from "@aaa-backend-stack/storage";

import CONFIG from "../configure";
import modelDefinitions from "../modelDefinitions";

export class Hook implements REST.SERVER.IHook {
    async init(api: REST.SERVER.Api) {
        // in the test environment, the storage lifecycle is managed by the test strategy
        // thus we are simply waiting for it to be configured...
        if (CONFIG.env === "test") {
            await storage.isInitialized();

            return;
        }

        await storage.initialize({
            ...CONFIG.storage,
            modelDefinitions
        });
    }

    async destroy(api: REST.SERVER.Api) {
        if (CONFIG.env !== "test") {
            storage.disconnect();
        }
    }

    async reinitialize(api: REST.SERVER.Api) {
        if (CONFIG.env !== "test") {
            await storage.reinitialize();
        }
    }

    getInfo() {

        const { password, ...other } = CONFIG.storage.pgConnection;

        return {
            storage: {
                ...other
            }
        };
    }

}

const hook = new Hook();

export default hook;

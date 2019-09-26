import CONFIG from "./configure";

import * as REST from "@aaa-backend-stack/rest";
import { attachGlobalUncaughtExceptionHandler } from "@aaa-backend-stack/utils";

// Start the server if run as "node index.js" automatically
if (!module.parent) {

    const api = new REST.SERVER.Api(CONFIG.rest);

    // tslint:disable-next-line:no-floating-promises
    api.ready.then(async () => {
        return api.startServer();
    });
}

// freak out on uncaughtExceptions!
attachGlobalUncaughtExceptionHandler();

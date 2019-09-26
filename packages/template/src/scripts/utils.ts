import { CONFIG } from "../configure";

import { injectCLI } from "@aaa-backend-stack/utils";

// tslint:disable-next-line:no-floating-promises
injectCLI(CONFIG.hashing);

import * as _ from "lodash";
import CONFIG from "../configure";

// auto-require all defined tests (exposed through the .__TESTS__ function in all of our own packages)
_.each(CONFIG.pkg.dependencies, (version, dependency) => {
    if (dependency.indexOf("@aaa-backend-stack/") !== -1) {
        // tslint:disable-next-line:no-require-imports no-var-requires non-literal-require
        const dep = require(dependency);

        if (dep.__TESTS__) {
            dep.__TESTS__();
        }
    }
});

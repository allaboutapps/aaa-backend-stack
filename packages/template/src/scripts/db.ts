import CONFIG from "../configure";

import { CLI } from "@aaa-backend-stack/build-tools";
import storage, { injectCLI } from "@aaa-backend-stack/storage";

import modelDefinitions from "../modelDefinitions";

// tslint:disable-next-line:no-floating-promises
storage.initialize({
    ...CONFIG.storage,
    modelDefinitions
}).then(async () => {

    // directly inject the storage cli tools
    return injectCLI(storage, {
        setUserPassword: {
            fn: async (uid: string, password: string) => {
                const user = await storage.models.User.findOne({ where: { uid } });
                await user.setPassword(password);
                await user.save();
                CLI.info(`password set: \n${JSON.stringify((user as any).dataValues, null, 2)}`);
            },
            defaultPassword: "d3m0",
            defaultUserUid: "e6b4e138-371b-48ca-ba85-991fbacf6d22"
        }
    });

});

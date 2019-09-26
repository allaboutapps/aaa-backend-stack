import logger from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";
import storage from "@aaa-backend-stack/storage";

import CONFIG from "../configure";

const hook: REST.SERVER.IHook = {

    async init(api) {

        await api.registerPlugin({
            register: REST.PLUGINS.getHapiAuthBasicPlugin(),
            options: {}
        });

        // secondary auth strategy, should only be used for dev-specific (e.g. documentation, dev-tools) endpoints that need to be protected in production envs
        api.server.auth.strategy("basic-authentication", "basic", false, {
            validateFunc: async function (request: REST.HAPI.Request, username: string, password: string, callback: Function) {

                try {
                    const user = await storage.models.User.findOne({
                        where: {
                            username
                        }
                    });

                    if (!user) {
                        return callback(null, false); // callback immediately
                    }

                    const hashedPassword = await CONFIG.hashing.hashPassword(password, user.salt);

                    if (hashedPassword !== user.password) {
                        return callback(null, false); // callback immediately
                    }

                    // get the associated permission scopes of the user...
                    const scope = await user.getScopeJsonArray();

                    // the here returned object will be appended to the request object inside auth.credentials object
                    // therefore it can be accessed via request.auth.credentials inside the controllers
                    return callback(null, true, {
                        scope,
                        user
                    });
                } catch (e) {
                    logger.error({
                        err: e
                    }, "basic-authentication.validate error");
                    callback(null, false);
                }

            }
        });
    }
};

export default hook;

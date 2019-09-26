import logger from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";
import storage, { SEQUELIZE } from "@aaa-backend-stack/storage";

const hook: REST.SERVER.IHook = {
    async init(api) {

        await api.registerPlugin({
            register: REST.PLUGINS.getHapiAuthBearerTokenPlugin(),
            options: {}
        });

        // user --> gives user (sequelize object) and accessToken
        // 3rd parameter true signals this is the default strategy
        // tslint:disable-next-line:no-object-literal-type-assertion
        api.server.auth.strategy("default-authentication-strategy", "bearer-access-token", true, <REST.PLUGINS.IHapiAuthBearerTokenOptions>{
            allowQueryToken: false,
            allowMultipleHeaders: false,
            validateFunc: async function (token, callback) {
                try {
                    // Ensure token to be a UUID
                    REST.JOI.assert(token, REST.JOI.string().guid());

                    // Try to lookup token
                    const accessToken = await storage.models.AccessToken.find({
                        where: {
                            token: token,
                            validUntil: {
                                $or: {
                                    $gte: SEQUELIZE.fn("NOW"), // find a user whose accessToken expiry is still in the future
                                    $eq: null // or null (for guests only)
                                }
                            }
                        },
                        include: [storage.models.User]
                    });

                    // no accessToken found?
                    if (!accessToken) {
                        return callback(null, false); // callback immediately
                    }

                    // user is not active?
                    if (accessToken.User.isActive === false) {
                        return callback(null, false); // callback immediately
                    }

                    // get the associated permission scopes of the user...
                    const scope = await accessToken.User.getScopeJsonArray();

                    // the here returned object will be appended to the request object inside auth.credentials object
                    // therefore it can be accessed via request.auth.credentials inside the controllers
                    const credentials = {
                        accessToken,
                        scope,
                        user: accessToken.User
                    };

                    return callback(null, true, credentials);

                } catch (e) {
                    logger.error({
                        err: e
                    }, "default-authentication-strategy.validate error");
                    callback(null, false);
                }
            }
        });

    }
};

export default hook;

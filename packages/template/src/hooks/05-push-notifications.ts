import logger from "@aaa-backend-stack/logger";
import { onExpiredToken, onUpdatedToken } from "@aaa-backend-stack/pushes";
import * as REST from "@aaa-backend-stack/rest";
import storage from "@aaa-backend-stack/storage";

const hook: REST.SERVER.IHook = {
    async init(api) {
        // register onExpiredToken handlers
        onExpiredToken((deviceType, deviceToken) => {
            return storage.models.PushToken.destroy({
                where: {
                    deviceType,
                    deviceToken
                }
            });
        });

        onUpdatedToken(async (deviceType, oldDeviceToken, newDeviceToken) => {
            const token = await storage.models.PushToken.findOne({
                where: {
                    deviceType,
                    deviceToken: oldDeviceToken
                }
            });

            if (!token) {
                logger.warn("push (android): Client not found for oldDeviceToken", oldDeviceToken);

                return null;
            }

            return token.update({ deviceToken: newDeviceToken });
        });
    }
};

export default hook;

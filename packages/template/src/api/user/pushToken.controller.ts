import logger from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";
import storage from "@aaa-backend-stack/storage";

@REST.controller("/api/v1")
export class PushToken extends REST.SERVER.MethodController {

    @REST.post("/pushtoken")
    @REST.authScope(["user", "guest"])
    @REST.documentation({
        description: "Adds a push-token to this user's profile",
        tags: ["app"]
    })
    @REST.validate({
        payload: REST.JOI.object().required().keys({
            deviceType: REST.JOI.string().valid("ios", "android").required(),
            deviceToken: REST.JOI.string().required()
        })
    })
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const requestUserUid = request.auth.credentials.user.uid;

        // PushTokens are PER device, this means:
        // If a different user reuses the same deviceToken, the UserUid MUST be overwritten!
        // Attention: Upsert works on index basis an can't be used in this case!
        const foundOrInitializedPushToken = await storage.models.PushToken.findOrInitialize({
            where: {
                deviceType: request.payload.deviceType,
                deviceToken: request.payload.deviceToken
            }
        });

        const instance = foundOrInitializedPushToken[0];

        if (instance.UserUid !== request.auth.credentials.user.uid) {
            logger.warn({
                instance,
                instanceUserUid: instance.UserUid,
                requestUserUid
            }, "addPushToken: switching user uid for pushToken instance (device user has changed)");
        }

        instance.UserUid = requestUserUid;

        const savedInstance = await instance.save();

        logger.debug({
            savedInstance
        }, "addPushToken: updated");

        return {};
    }

}

export default new PushToken();

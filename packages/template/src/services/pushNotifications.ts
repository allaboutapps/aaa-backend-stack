import * as _ from "lodash";

import * as push from "@aaa-backend-stack/pushes";
import storage, { IInstances } from "@aaa-backend-stack/storage";

// This is a good reference to get started on how to link useruids to pushtokens and send messages
export async function getPushTokensForUserUids(userUids: string[]): Promise<IInstances.IPushToken[]> {
    return storage.models.PushToken.findAll({ where: { UserUid: { $in: userUids } } });
}

export async function sendPushNotificationToUserUid(userUid: string, content: push.IUnifiedPushContent) {
    return sendPushNotificationToUserUids([userUid], content);
}

export async function sendPushNotificationToUserUids(userUids: string[], content: push.IUnifiedPushContent) {

    const tokens = await getPushTokensForUserUids(userUids);

    return push.sendMessage(content, {
        ios: _.filter(tokens, { deviceType: "ios" }).map((token) => token.deviceToken),
        android: _.filter(tokens, { deviceType: "android" }).map((token) => token.deviceToken)
    });

}

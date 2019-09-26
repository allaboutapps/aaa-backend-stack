import { AndroidPushNotification, ISendMessageResult } from "./AndroidPushNotification";
import { ApplePushNotification } from "./ApplePushNotification";
import { Responses } from "apn";

export interface ISendTokens {
    ios: string[];
    android: string[];
}

export interface IUnifiedPushPayload {
    "action-show-screen": string;
    badge: number; // double badge ios and android differences
    [name: string]: any;
}

export interface IUnifiedPushContent {
    title?: string; // heading
    alert?: string; // the content
    contentAvailable?: number;
    badge?: number; // app icon badge (set this also in the payload for android!)
    payload: Partial<IUnifiedPushPayload>;
}

export type ICombinedPushResult = [Promise<ISendMessageResult>, Promise<boolean | Responses>];

/**
 * a dead simple utility method to directly send android and ios push without the need to instanciate the respective
 * AndroidPushNotification and ApplePushNotification classes
 */
export function sendMessage(content: IUnifiedPushContent, tokens: Partial<ISendTokens>): ICombinedPushResult {

    let androidPromise: Promise<ISendMessageResult> = Promise.resolve(false);
    let iosPromise: Promise<boolean | Responses> = Promise.resolve(false);

    // Now send the push notifications
    if (tokens.android
        && tokens.android.length > 0) {

        const androidPushNotification = new AndroidPushNotification(tokens.android, content);
        androidPromise = androidPushNotification.send();
    }

    // iOS
    // logger.info("iOS tokens:", tokensIos);
    if (tokens.ios
        && tokens.ios.length > 0) {
        const { alert, title, ...rest } = content;

        const iosPushNotification = new ApplePushNotification(tokens.ios, {
            ...rest,
            ...(title && alert ? { alert: { title, body: alert } } : { alert })
        });

        iosPromise = iosPushNotification.send();
    }

    return [
        androidPromise,
        iosPromise
    ];
}

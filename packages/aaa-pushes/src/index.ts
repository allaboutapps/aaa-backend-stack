export { ApplePushNotification, IAPNContent } from "./ApplePushNotification";
export { AndroidPushNotification, IAndroidJSONResults, IAndroidResult, ISendMessageResult } from "./AndroidPushNotification";
export { onExpiredToken, onUpdatedToken, IExpiredTokenHookFn, IUpdatedTokenHookFn, getHooks, clearHooks } from "./hooks";
export { apnProvider, ILazyInitializedApnProvider } from "./apnProvider";
export { default as gcmMock, GcmMock } from "./gcmMock";
export { injectCLI, IInjectPushCLIparsedArgs } from "./cli";
export { sendMessage, IUnifiedPushContent, IUnifiedPushPayload, ICombinedPushResult, ISendTokens } from "./sendMessage";
export { IPushConfig } from "./IPushConfig";
export { Responses, ResponseFailure } from "apn";

/**
 *
 * Important: apnProvider must be statically initialized before its usage.
 * callback hooks can also be defined.
 *
 *
 * Base classes to send Push Notifications with Apple and Google.
 *
 * Usage
 * -----
 *     // simple Usage:
 *     sendMessage(content, { ios: tokens[], android: tokens[] });
 *
 *     // Advanced Usage:
 *     let pnApple = new ApplePushNotification(tokens: string[], apnContent: ApnContent);
 *     pnApple.send();  // -> Promise
 *
 *     let pnAndroid = new AndroidPushNotification(tokens: string[], payload: any);
 *     pnAndroid.send();  // -> Promise
 *
 * See also
 * --------
 *
 * Apple
 * - https://github.com/node-apn/node-apn
 *
 * Android
 * - https://developers.google.com/cloud-messaging/http-server-ref#table5
 */

export function __TESTS__() {
    require("./tests");
}

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "apn"
];

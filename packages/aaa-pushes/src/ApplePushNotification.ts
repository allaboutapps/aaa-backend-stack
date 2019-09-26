import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/pushes");

import * as path from "path";
import * as _ from "lodash";

import { getHooks } from "./hooks";
import { apnProvider } from "./apnProvider";
import { Responses, ResponseFailure } from "apn";

// Apple Push Notification Content. See https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html#//apple_ref/doc/uid/TP40008194-CH100-SW1
export interface IAPNContent {
    payload?: any;    // JSON object
    expiry?: number;  // Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now
    badge?: number;   // 3
    sound?: string;   // "ping.aiff"
    alert?: any;      // String (eg. "\uD83D\uDCE7 \u2709 You have a new message") or JSON
    category?: string;  // Used to define custom actions (see docs)
    contentAvailable?: number;
}

export class ApplePushNotification {
    private tokens = [];
    private notification;
    private isSent = false;

    constructor(tokens: string[], apnContent: IAPNContent) {
        this.tokens = tokens;

        this.notification = new apnProvider.Notification();

        // APN v2 - topic (= app bundle id) is mandadory!
        // https://github.com/node-apn/node-apn/issues/439
        this.notification.topic = apnProvider.CONFIG.ios.jwt.appBundleId; // bundle id required.
        this.notification.retryLimit = apnProvider.CONFIG.ios.retryCount;

        if (apnContent.expiry) {
            this.notification.expiry = apnContent.expiry;
        }
        if (apnContent.badge) {
            this.notification.badge = apnContent.badge;
        }
        if (apnContent.sound) {
            this.notification.sound = apnContent.sound;
        } else if (!(apnContent.contentAvailable && apnContent.contentAvailable === 1)) {
            // only force sound if contentAvailable not equal to 1,
            // contentAvailable equal to 1 indicates silent push
            this.notification.sound = "ping.aiff";
        }

        if (apnContent.alert) {
            this.notification.alert = apnContent.alert;
        }
        if (apnContent.category) {
            this.notification.category = apnContent.category;
        }
        if (apnContent.payload) {
            this.notification.payload = apnContent.payload;
        }
        if (apnContent.contentAvailable) {
            this.notification.contentAvailable = apnContent.contentAvailable;
        }
    }

    send(): Promise<boolean | Responses> {
        if (this.isSent) {
            return Promise.reject("APN Error: Cannot send the same ApplePushNotification twice!");
        }

        logger.info({ notification: this.notification, tokens: this.tokens }, "push (ios): APN sending push to " + this.tokens.length + " devices");

        if (this.tokens.length === 0) {
            logger.info("push (ios): APN: don't send because 0 tokens");
            return Promise.resolve(true);
        }

        // in the test environment, the apn/mock implementation is used, thus no real payloads are sent
        // there we can safely use pushes and disable the dontSend shortcut.
        if (process.env.NODE_ENV !== "test" && apnProvider.CONFIG.ios.send === false) {
            logger.info("push (ios): APN: don't send because configConfig.ios.dontSend === true and env is not test");
            return Promise.resolve(true);
        }

        logger.debug({
            notification: this.notification,
            tokens: this.tokens,
        }, "push (ios): attempting to send push...");

        return apnProvider.send(this.notification, this.tokens).then(async (results: Responses): Promise<Responses> => {

            const hooksToComplete = [];

            this.isSent = true; // flag as sent!

            results.sent.forEach((token) => {
                logger.debug({
                    token
                }, "push (ios): successfully sent ios push update");
            });
            results.failed.forEach((failure: ResponseFailure) => {

                if (failure.error) {

                    // A transport-level error occurred (e.g. network problem)
                    logger.error({
                        failure
                    }, "push (ios): failed to send ios push (a transport related problem was encountered)");

                } else {

                    // you may handle specific response status codes here...
                    // see https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html
                    // 400: Bad request (with `response.reason === "BadDeviceToken"` indicates in invalid push token)
                    // 403: There was an error with the certificate or with the provider authentication token
                    // 405: The request used a bad :method value. Only POST requests are supported.
                    // 410: The device token is no longer active for the topic.
                    // 413: The notification payload was too large.
                    // 429: The server received too many requests for the same device token.
                    // 500: Internal server error
                    // 503: The server is shutting down and unavailable.

                    if (failure.status === "403" || (failure.status as any) === 403) {

                        // Authentication related problem! Log this to fatal as this hints at push setup related problems!
                        logger.fatal({
                            failure
                        }, "push (ios): 403 - There was an error with the provider authentication token");

                    } else if (failure.status === "410"
                        || (failure.status as any) === 410
                        || ((failure.status === "400" || (failure.status as any) === 400)
                            && failure.response && failure.response.reason === "BadDeviceToken")) {

                        // the device token has expired, silently delete it.
                        logger.warn({
                            failure
                        }, "push (ios): encountered a failed push because of expired push token (executing expiredTokenHooks hook) ");

                        _.each(getHooks().expiredTokenHooks, (hookFn) => {
                            hooksToComplete.push(hookFn("ios", failure.device).catch((error) => {
                                logger.error({ error }, "apnProvider.send (silent) failure with onExpiredTokenHooks handler): generic catch error handler, none was setupped for onExpiredToken hook fn");
                            }));
                        });

                    } else {
                        logger.error({
                            failure
                        }, "push (ios): failed to send ios push (see failure details)");
                    }

                }

            });

            // await for all (failed) hooks to complete before returning...
            await Promise.all(hooksToComplete);

            return results;

        });

    }
}

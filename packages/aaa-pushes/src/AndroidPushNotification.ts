import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/pushes");

import * as serverdate from "@aaa-backend-stack/serverdate";
import * as _ from "lodash";
const fetch = require("node-fetch"); // use fetch instead of request api

import { apnProvider } from "./apnProvider";
import { getHooks } from "./hooks";

class ApiError extends Error {

    public response: any;

    constructor(public message: string, public res: any) {
        super(message);

        // see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        // no loger extend build ins as this will always lead to problems!
        (Object as any).setPrototypeOf(this, ApiError.prototype);

        this.name = "ApiError";
        this.message = message;
        this.stack = (<any>new Error()).stack;
        this.response = res;
    }
}

export interface IAndroidResult {
    error: any;
    registration_id: string;
}
export interface IAndroidJSONResults {
    results: IAndroidResult[];
}

export type ISendMessageResult = IAndroidJSONResults | boolean;

export class AndroidPushNotification {
    private msg = {
        data: null,
        registration_ids: [] // client tokens
    };

    private currentTry: number = 0;
    private isSent = false;
    private _url = apnProvider.CONFIG.android.url;
    private _apiKey = apnProvider.CONFIG.android.apiKey;
    private _shouldSend = apnProvider.CONFIG.android.send;

    constructor(tokens: string[], payload: any, url = apnProvider.CONFIG.android.url, apiKey = apnProvider.CONFIG.android.apiKey, shouldSend = apnProvider.CONFIG.android.send) {
        this.msg.data = payload;
        this.msg.registration_ids = tokens;
        this._url = url;
        this._apiKey = apiKey;
        this._shouldSend = shouldSend;
    }

    send() {
        if (this.isSent) {
            return Promise.reject("GCM Error: Cannot send the same AndroidPushNotification twice!");
        }

        logger.info({ notification: this.msg }, "push (android): GCM sending push to " + this.msg.registration_ids.length + " devices");

        if (this.msg.registration_ids.length === 0) {
            logger.info("push (android): GCM: don't send because 0 devices");
            return Promise.resolve(true);
        }

        if (this._shouldSend === false) {
            logger.info("push (android): GCM: don't send because config.android.send === false");
            return Promise.resolve(true);
        }

        return this.trySendMessage();
    }

    private async trySendMessage(): Promise<ISendMessageResult> {
        let self = this;
        this.currentTry += 1;

        try {

            const headers = {
                "Authorization": "key=" + this._apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json"
            };

            const body = this.msg;

            logger.debug({
                headers,
                body,
                currentTry: this.currentTry
            }, "push (android): attempting to send push...");

            const response = await fetch(this._url, {
                method: "POST",
                timeout: 15000, // max amout to make request...
                headers: headers,
                body: JSON.stringify(body)
            });

            this.isSent = true; // flag as sent!

            if (response.status !== 200) {
                throw new ApiError(response.statusText, response);
            }

            logger.debug({ response }, `push (android): GCM response received: ${response.status}`);
            const json: IAndroidJSONResults = await response.json();
            await this.processResponse(json);
            return json;

        } catch (reason) {
            if (reason instanceof ApiError) {
                // console.log(reason.response.status);
                if (reason.response.status === 400) {
                    logger.error("push (android): ANDROID GCM PUSH ERROR - INVALID JSON", this.msg);
                    throw reason;
                } else if (reason.response.status === 401) {
                    logger.error("push (android): ANDROID GCM PUSH ERROR - INVALID AUTH");
                    throw reason;
                } else if (reason.response.status >= 500 && reason.response.status <= 599) {
                    return this.retry("GCM Received status " + reason.response.status, self.parseRetryAfter(reason.response.headers));
                } else {
                    return this.retry("GCM Received unexpected status " + reason.response.status, null);
                }
            }

            // unexpected error.
            throw reason;
        }
    }

    private processResponse(json: IAndroidJSONResults) {
        // console.log("GCM processResponse", response.body);
        let promises: Promise<any>[] = [];
        let result: IAndroidResult;
        let oldClientToken;
        for (let i = 0; i < json.results.length; i++) {
            result = json.results[i];
            oldClientToken = this.msg.registration_ids[i];
            if (result.error) {
                logger.warn({
                    result, oldClientToken
                }, "push (android): ANDROID GCM PUSH REMOVE (executing expiredTokenHooks hook)");

                _.each(getHooks().expiredTokenHooks, (hookFn) => {
                    promises.push(hookFn("android", oldClientToken));
                });

            } else if (result.registration_id) {
                // Remove old token and save new one
                logger.warn({ result, oldClientToken, newClientToken: result.registration_id }, "push (android): ANDROID GCM PUSH UPDATE (executing updatedTokenHooks hook)");

                _.each(getHooks().updatedTokenHooks, (hookFn) => {
                    promises.push(hookFn("android", oldClientToken, result.registration_id));
                });
            }
        }
        return promises;
    }

    private parseRetryAfter(headers) {
        /* tslint:disable:no-string-literal */
        let backOff = null;
        if (headers["retry-after"]) {
            let seconds = parseInt(headers["retry-after"], 10);
            if (!isNaN(seconds)) {
                backOff = seconds * 1000;
            } else {
                let date = serverdate.getMoment(headers["retry-after"]);
                if (date.isValid()) {
                    let now = serverdate.getMoment();
                    if (date.isAfter(now)) { backOff = date.diff(now); }
                }
            }
        }
        return backOff;
        /* tslint:enable:no-string-literal */
    }

    private retry(err, backOff): Promise<ISendMessageResult> | boolean {
        if (this.currentTry < apnProvider.CONFIG.android.retryCount) {
            if (!backOff) {
                backOff = process.env.NODE_ENV === "test" ? 0 : apnProvider.CONFIG.android.backOff * Math.pow(2, this.currentTry);
            }
            logger.warn({ backOff, err }, "push (android): ANDROID GCM PUSH ERROR - RETRY IN");
            return Promise.delay(backOff).then(() => {
                return this.trySendMessage();
            });
        } else {
            logger.error({ err }, "push (android): ANDROID GCM PUSH ERROR - FINAL");
            return false;
        }
    }
}

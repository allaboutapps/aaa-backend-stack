import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/pushes");

import * as _ from "lodash";
import { ILazySingletonInitializer } from "@aaa-backend-stack/build-tools";
import { IPushConfig } from "./IPushConfig";
import { Provider, Notification } from "apn";

// see https://github.com/Microsoft/TypeScript/issues/4890
// and https://github.com/Microsoft/TypeScript/pull/13604
export type Constructor<T> = new () => T;

export type ILazyInitializedApnProvider = ILazySingletonInitializer<IPushConfig> & Provider & {
    on: (...args: any[]) => any; // not defined in apnProvider options...
    Notification: Constructor<Notification>;
};


export const apnProvider: Partial<ILazyInitializedApnProvider> = {
    configure: (config: IPushConfig) => {

        if (apnProvider.CONFIG) {
            console.warn("@aaa-backend-stack/pushes.apnProvider was already configured, returning previous config");
            return apnProvider.CONFIG;
        }

        apnProvider.CONFIG = config;

        // We will use the apn-mock implementation if environment is test (dontSend pushes wont be evaluated)
        // https://github.com/node-apn/node-apn/blob/master/doc/testing.markdown
        const apn = process.env.NODE_ENV === "test" ? (() => {
            logger.info("push (ios): config env is test, using ios apn/mock implementation (env variable PUSH_IOS_SEND is discarted)");
            return require("apn/mock");
        })() : require("apn"); // else use the default impl.

        // attach the Constructor to use for new Notificatons.
        apnProvider.Notification = apn.Notification;


        _.extendWith(apnProvider, new apn.Provider({
            token: {
                key: config.ios.jwt.keyFile,
                keyId: config.ios.jwt.keyId,
                teamId: config.ios.jwt.teamId
            },
            production: config.ios.production,
            proxy: config.ios.proxy
        }));

        /**
         * Setup iOS apn.Provider
         * JWT apn keys are used here, see https://github.com/node-apn/node-apn#connecting
         */

        apnProvider.on("transmissionError", (errCode, notification, device) => {
            if (errCode === 8) {
                logger.error({ errCode, notification, device }, "push (ios): APN Transmission Error 8 (Invalid Token):");
            } else {
                logger.error({ errCode, notification, device }, "push (ios): APN Transmission Error");
            }
        });

        apnProvider.on("socketError", (err) => {
            logger.error({ err }, "push (ios): APN Socket Error");
        });

        apnProvider.on("error", (err) => {
            logger.error({ err }, "push (ios): APN Error");
        });

        return config;

    }
};


export default apnProvider;

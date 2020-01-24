import { Agent as HttpsAgent } from "https";

export interface IPushConfig {
    android: {
        send: boolean; // only send notification if set to true
        apiKey: string;
        url: string;
        backOff: number;
        retryCount: number;
        proxy?: {
            agent: HttpsAgent;
        };
    };

    ios: {
        send: boolean; // only send notification if set to true
        production: boolean;
        jwt: {
            keyFile: string;
            keyId: string;
            teamId: string;
            appBundleId: string;
        },
        retryCount: number;
        proxy?: {
            host: string;
            port: number;
        };
    };
}

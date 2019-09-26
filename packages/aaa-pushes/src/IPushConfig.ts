export interface IPushConfig {
    android: {
        send: boolean; // only send notification if set to true
        apiKey: string;
        url: string;
        backOff: number;
        retryCount: number;
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
    };
}

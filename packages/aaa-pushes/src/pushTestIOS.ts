export interface IPushTestOptions {
    clientToken: string;
    appBundleId: string;
    keyFile: string;
    keyId: string;
    teamId: string;
    production: boolean;
}

export function pushTestIOS(options: IPushTestOptions, msg = "\uD83D\uDCE7 \u2709 You have a new message"): Promise<boolean> {

    return new Promise<boolean>((resolve, reject) => {
        const apn = require("apn");

        const apnProvider = new apn.Provider({
            token: {
                key: options.keyFile,
                keyId: options.keyId,
                teamId: options.teamId
            },
            production: options.production
        });

        let note = new apn.Notification();

        note.alert = msg;
        note.topic = options.appBundleId;
        note.sound = "ping.aiff"; // force sound on ios

        console.log("Using:", JSON.stringify({
            alert: msg,
            options,
            sound: "ping.aiff"
        }, null, 2));

        apnProvider.send(note, [options.clientToken]).then((results) => {

            console.log("Results:", JSON.stringify(results, null, 2));

            results.sent.forEach((token) => {
                console.log("successfully sent ", token);
                resolve(true);
            });

            results.failed.forEach((failure) => {
                console.error("failure sent ", failure);
                reject(new Error(failure));
            });
        });
    });

}



import { AndroidPushNotification, IAndroidJSONResults } from "./AndroidPushNotification";
export interface IAndroidPushTestOptions {
    token: string;
    url: string;
    apiKey: string;
}

export async function pushTestAndroid(options: IAndroidPushTestOptions, msg = "\uD83D\uDCE7 \u2709 You have a new message") {

    const content = {
        title: "New Message",
        alert: msg,
        payload: {}
    };

    console.log("Using:", JSON.stringify({
        ...options,
        content
    }, null, 2));

    const androidPush = new AndroidPushNotification([options.token], content, options.url, options.apiKey, true);

    try {
        const res = await androidPush.send();
        console.log("Result:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(new Error(e));
        throw new Error(e);
    }
}


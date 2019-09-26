export type IExpiredTokenHookFn = (deviceType: "android" | "ios", expiredDeviceToken: string) => Promise<any | void>;
export type IUpdatedTokenHookFn = (deviceType: "android" | "ios", expiredDeviceToken: string, newDeviceToken: string) => Promise<any | void>;

let expiredTokenHooks: IExpiredTokenHookFn[] = [];
let updatedTokenHooks: IUpdatedTokenHookFn[] = [];

export function onExpiredToken(fn: IExpiredTokenHookFn) {
    expiredTokenHooks.push(fn);
}

export function onUpdatedToken(fn: IUpdatedTokenHookFn) {
    updatedTokenHooks.push(fn);
}

export function getHooks() {
    return {
        expiredTokenHooks,
        updatedTokenHooks
    };
}

export function clearHooks() {
    expiredTokenHooks = [];
    updatedTokenHooks = [];
}

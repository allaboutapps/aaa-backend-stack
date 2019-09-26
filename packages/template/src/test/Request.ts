import { httpRequest, IHttpTestRequest, IHttpTestResponse } from "@aaa-backend-stack/test-environment";

import * as REST from "@aaa-backend-stack/rest";
import * as fixtures from "./fixtures";

export interface IUserInfo {
    uid: string;
    AccessToken: {
        token: string;
    };
    RefreshToken?: {
        token: string;
    };
}

export interface IRequestUsers {
    [userIdentifier: string]: IUserInfo;
}

export const users: IRequestUsers = {
    user1: fixtures.user1,
    user2: fixtures.user2,
    admin1: fixtures.admin1,
    guest1: fixtures.guest1,
    deactivated: fixtures.deactivated
};

export type IAvailableTestUsers = "user1" | "user2" | "admin1" | "guest1" | "deactivated";

export interface IRequestOptions {
    user?: IAvailableTestUsers;
}

export interface IResponse<T> extends IHttpTestResponse {
    body: T;
}

// tslint:disable-next-line:no-unnecessary-class
export default class Request {
    static users: IRequestUsers = users; // reuse the above definition

    private static api: REST.SERVER.Api = null;

    // tslint:disable-next-line:function-name
    static initialize(api: REST.SERVER.Api) {
        Request.api = api;
    }

    // tslint:disable-next-line:function-name
    static create(verb: string, path: string, options?: IRequestOptions): IHttpTestRequest {
        let request = <IHttpTestRequest>(<any>httpRequest(Request.api.server.info.uri))[verb.toLowerCase()](path);
        if (options && options.user && Request.user(options.user)) {
            request = request.set("Authorization", `Bearer ${Request.user(options.user).AccessToken.token}`);
        }

        return request;
    }

    // tslint:disable-next-line:function-name
    static user(username: IAvailableTestUsers): IUserInfo {
        return users[username];
    }

}

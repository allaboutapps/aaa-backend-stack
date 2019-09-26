export function getHapiAuthBasicPlugin() {
    return require("hapi-auth-basic");
}

export function getHapiAuthBearerTokenPlugin() {
    return require("hapi-auth-bearer-token");
}

export function getHapiSwaggerPlugin() {
    return require("hapi-swagger");
}

// typings for hapi-auth-bearer-token extracted from https://github.com/johnbrett/hapi-auth-bearer-token

export interface IHapiAuthBearerTokenOptionsInternal {
    accessTokenName: string; // Default: 'access_token'
    allowQueryToken: boolean; // Default: false
    allowCookieToken: boolean; // Default: false
    allowMultipleHeaders: boolean; // Default: false
    tokenType: string; // Default: 'Bearer'
    allowChaining: boolean; // Default: false
    unauthorizedFunc: (message: any, scheme: any, attributes: any) => any; // Default: Boom.unauthorized
    validateFunc: (token: string, callback: IHapiAuthBearerTokenValidate) => any;
}

export type IHapiAuthBearerTokenOptions = Partial<IHapiAuthBearerTokenOptionsInternal>;
export type IHapiAuthBearerTokenValidate = (err: Error, isValid: boolean, credentials?: any, artifacts?: any) => void | any;

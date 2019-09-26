// tslint:disable-next-line:no-require-imports no-var-requires
const FB = require("fb");
import * as _ from "lodash";

import logger from "@aaa-backend-stack/logger";
import { BASE as Base } from "@aaa-backend-stack/rest";
import storage, { IInstances } from "@aaa-backend-stack/storage";

import CONFIG from "../../configure";
import * as errors from "./_errors";
import { IAuthenticationPayloadFacebook, IFacebookUserInfo, IFacebookUserInfoResponse } from "./_types";

export class FacebookAuthenticationService {
    private static readonly IS_TEST_ENVIRONMENT: boolean = process.env.NODE_ENV === "test" && !process.env.TEST_ENV_FACEBOOK;

    constructor() {
        FB.options({
            appId: CONFIG.auth.facebook.appId,
            appSecret: CONFIG.auth.facebook.appSecret,
            version: "v2.12"
        });
    }

    async authenticate(payload: IAuthenticationPayloadFacebook): Promise<IInstances.IUser> {
        if (!CONFIG.auth.facebook.enabled) {
            logger.debug("FacebookAuthenticationService.authenticate: Facebook authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_FACEBOOK_AUTHENTICATION_DISABLED);
        }

        logger.debug("FacebookAuthenticationService.authenticate: performing Facebook authentication");

        const facebookUserInfo = FacebookAuthenticationService.IS_TEST_ENVIRONMENT ?
            await this.mockValidateToken(payload) :
            await this.validateToken(payload);

        const user = await this.findOrCreateUser(facebookUserInfo);

        logger.debug({ userUid: user.uid }, "FacebookAuthenticationService.authenticate: successfully performed Facebook authentication");

        return user;
    }

    private async validateToken(payload: IAuthenticationPayloadFacebook): Promise<IFacebookUserInfo> {
        if (!CONFIG.auth.facebook.enabled) {
            logger.debug("FacebookAuthenticationService.validateToken: Facebook authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_FACEBOOK_AUTHENTICATION_DISABLED);
        }

        try {
            const facebookUserInfoResponse: IFacebookUserInfoResponse = await FB.api("me", "get", {
                fields: ["id", "email", "name", "first_name", "last_name"],
                access_token: payload.token
            });

            if (!_.isNil(facebookUserInfoResponse.error)) {
                logger.warn({ err: facebookUserInfoResponse.error }, "FacebookAuthenticationService.validateToken: received error from Facebook API");

                throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
            }

            return _.omit(facebookUserInfoResponse, ["error"]);
        } catch (err) {
            logger.warn({ err }, "FacebookAuthenticationService.validateToken: failed to verify token");

            throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
        }
    }

    private async mockValidateToken(payload: IAuthenticationPayloadFacebook): Promise<IFacebookUserInfo> {
        if (!CONFIG.auth.facebook.enabled) {
            logger.debug("FacebookAuthenticationService.mockValidateToken: Facebook authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_FACEBOOK_AUTHENTICATION_DISABLED);
        }

        switch (payload.token) {
            case "valid":
                return {
                    id: "doesnotexistfacebookid"
                };
            case "validwithemail":
                return {
                    email: "newfacebook@test.com",
                    id: "doesnotexisteitherfacebookid"
                };
            case "validexisting":
                return {
                    id: "superuniquefacebookid"
                };
            case "validexistingemail":
                return {
                    email: "facebook@test.com",
                    id: "definitelydoesnotexistfacebookid"
                };
            case "deactivated":
                return {
                    email: "deactivated@test.com",
                    id: "definitelydoesnotexisteitherfacebookid"
                };
            case "invalid":
                throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
            default:
                throw new Error("Test case not implemented");
        }
    }

    private async findOrCreateUser(facebookUserInfo: IFacebookUserInfo): Promise<IInstances.IUser> {
        if (!CONFIG.auth.facebook.enabled) {
            logger.debug("FacebookAuthenticationService.findOrCreateUser: Facebook authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_FACEBOOK_AUTHENTICATION_DISABLED);
        }

        logger.debug({ facebookId: facebookUserInfo.id, facebookEmail: facebookUserInfo.email }, "FacebookAuthenticationService.findOrCreateUser: trying to find existing user");

        let user = await storage.models.User.findOne({
            where: {
                $or: [{
                    facebookId: facebookUserInfo.id
                }, {
                    username: facebookUserInfo.email
                }]
            }
        });

        if (_.isNil(user)) {
            logger.debug({ facebookId: facebookUserInfo.id, facebookEmail: facebookUserInfo.email },
                "FacebookAuthenticationService.findOrCreateUser: user does not exist, creating");

            user = await storage.models.User.create({
                username: facebookUserInfo.email,
                password: null,
                salt: null,
                facebookId: facebookUserInfo.id,
                facebookInfo: facebookUserInfo
            });
        } else {
            logger.debug({ facebookId: facebookUserInfo.id, facebookEmail: facebookUserInfo.email, userUid: user.uid },
                "FacebookAuthenticationService.findOrCreateUser: user exists, checking for conflicts & updates");

            if (!user.isActive) {
                logger.debug({ facebookId: facebookUserInfo.id, facebookEmail: facebookUserInfo.email, userUid: user.uid },
                    "FacebookAuthenticationService.findOrCreateUser: user is deactivated, rejecting authentication");

                throw Base.createBoom(errors.FORBIDDEN_USER_DEACTIVATED);
            }

            user.facebookId = facebookUserInfo.id;
            user.facebookInfo = facebookUserInfo;

            if (!_.isEmpty(facebookUserInfo.email)) {
                user.username = facebookUserInfo.email;
            }

            await user.save();
        }

        logger.debug({ facebookId: facebookUserInfo.id, facebookEmail: facebookUserInfo.email, userUid: user.uid },
            "FacebookAuthenticationService.findOrCreateUser: successfully retrieved user");

        return user;
    }
}

export const instance = new FacebookAuthenticationService();
export default instance;

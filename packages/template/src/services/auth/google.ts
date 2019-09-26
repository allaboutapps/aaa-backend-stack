import { OAuth2Client } from "google-auth-library";
import * as _ from "lodash";

import logger from "@aaa-backend-stack/logger";
import { BASE as Base } from "@aaa-backend-stack/rest";
import * as serverdate from "@aaa-backend-stack/serverdate";
import storage, { IInstances } from "@aaa-backend-stack/storage";

import CONFIG from "../../configure";
import * as errors from "./_errors";
import { IAuthenticationPayloadGoogle, IGoogleUserInfo } from "./_types";

// Implements Google Sign-In using ID token OAuth flow, see https://developers.google.com/identity/sign-in/web/backend-auth#using-a-google-api-client-library

export class GoogleAuthenticationService {
    private static readonly IS_TEST_ENVIRONMENT: boolean = process.env.NODE_ENV === "test" && !process.env.TEST_ENV_GOOGLE;

    private oauthClient: OAuth2Client;

    constructor() {
        this.oauthClient = new OAuth2Client(CONFIG.auth.google.clientId);
    }

    async authenticate(payload: IAuthenticationPayloadGoogle): Promise<IInstances.IUser> {
        if (!CONFIG.auth.google.enabled) {
            logger.debug("GoogleAuthenticationService.authenticate: Google authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_GOOGLE_AUTHENTICATION_DISABLED);
        }

        logger.debug("GoogleAuthenticationService.authenticate: performing Google authentication");

        const googleUserInfo = GoogleAuthenticationService.IS_TEST_ENVIRONMENT ?
            await this.mockValidateToken(payload) :
            await this.validateToken(payload);

        const user = await this.findOrCreateUser(googleUserInfo);

        logger.debug({ userUid: user.uid }, "GoogleAuthenticationService.authenticate: successfully performed Google authentication");

        return user;
    }

    private async validateToken(payload: IAuthenticationPayloadGoogle): Promise<IGoogleUserInfo> {
        if (!CONFIG.auth.google.enabled) {
            logger.debug("GoogleAuthenticationService.validateToken: Google authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_GOOGLE_AUTHENTICATION_DISABLED);
        }

        try {
            const ticket = await this.oauthClient.verifyIdToken({
                idToken: payload.idToken,
                audience: CONFIG.auth.google.clientId
            });

            return ticket.getPayload();
        } catch (err) {
            logger.warn({ err }, "GoogleAuthenticationService.validateToken: failed to verify token");

            throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
        }
    }

    private async mockValidateToken(payload: IAuthenticationPayloadGoogle): Promise<IGoogleUserInfo> {
        if (!CONFIG.auth.google.enabled) {
            logger.debug("GoogleAuthenticationService.mockValidateToken: Google authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_GOOGLE_AUTHENTICATION_DISABLED);
        }

        switch (payload.idToken) {
            case "valid":
                return {
                    aud: "totallylegitaudience",
                    exp: serverdate.getMoment().add(1, "year").unix(),
                    iat: serverdate.getMoment().subtract(1, "minute").unix(),
                    iss: "https://accounts.google.com.definitely.not.fake",
                    sub: "doesnotexistgoogleid"
                };
            case "validwithemail":
                return {
                    aud: "totallylegitaudience",
                    email: "newgoogle@test.com",
                    exp: serverdate.getMoment().add(1, "year").unix(),
                    iat: serverdate.getMoment().subtract(1, "minute").unix(),
                    iss: "https://accounts.google.com.definitely.not.fake",
                    sub: "doesnotexisteithergoogleid"
                };
            case "validexisting":
                return {
                    aud: "totallylegitaudience",
                    exp: serverdate.getMoment().add(1, "year").unix(),
                    iat: serverdate.getMoment().subtract(1, "minute").unix(),
                    iss: "https://accounts.google.com.definitely.not.fake",
                    sub: "superuniquegoogleid"
                };
            case "validexistingemail":
                return {
                    aud: "totallylegitaudience",
                    email: "google@test.com",
                    exp: serverdate.getMoment().add(1, "year").unix(),
                    iat: serverdate.getMoment().subtract(1, "minute").unix(),
                    iss: "https://accounts.google.com.definitely.not.fake",
                    sub: "definitelydoesnotexistgoogleid"
                };
            case "deactivated":
                return {
                    aud: "totallylegitaudience",
                    email: "deactivated@test.com",
                    exp: serverdate.getMoment().add(1, "year").unix(),
                    iat: serverdate.getMoment().subtract(1, "minute").unix(),
                    iss: "https://accounts.google.com.definitely.not.fake",
                    sub: "definitelydoesnotexisteithergoogleid"
                };
            case "invalid":
                throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
            default:
                throw new Error("Test case not implemented");
        }
    }

    private async findOrCreateUser(googleUserInfo: IGoogleUserInfo): Promise<IInstances.IUser> {
        if (!CONFIG.auth.google.enabled) {
            logger.debug("GoogleAuthenticationService.findOrCreateUser: Google authentication disabled, aborting");

            throw Base.createBoom(errors.FORBIDDEN_GOOGLE_AUTHENTICATION_DISABLED);
        }

        logger.debug({ googleSub: googleUserInfo.sub, googleEmail: googleUserInfo.email }, "GoogleAuthenticationService.findOrCreateUser: trying to find existing user");

        let user = await storage.models.User.findOne({
            where: {
                $or: [{
                    googleId: googleUserInfo.sub
                }, {
                    username: googleUserInfo.email
                }]
            }
        });

        if (_.isNil(user)) {
            logger.debug({ googleSub: googleUserInfo.sub, googleEmail: googleUserInfo.email }, "GoogleAuthenticationService.findOrCreateUser: user does not exist, creating");

            user = await storage.models.User.create({
                username: googleUserInfo.email,
                password: null,
                salt: null,
                googleId: googleUserInfo.sub,
                googleInfo: googleUserInfo
            });
        } else {
            logger.debug({ googleSub: googleUserInfo.sub, googleEmail: googleUserInfo.email, userUid: user.uid },
                "GoogleAuthenticationService.findOrCreateUser: user exists, checking for conflicts & updates");

            if (!user.isActive) {
                logger.debug({ googleSub: googleUserInfo.sub, googleEmail: googleUserInfo.email, userUid: user.uid },
                    "GoogleAuthenticationService.findOrCreateUser: user is deactivated, rejecting authentication");

                throw Base.createBoom(errors.FORBIDDEN_USER_DEACTIVATED);
            }

            user.googleId = googleUserInfo.sub;
            user.googleInfo = googleUserInfo;

            if (!_.isEmpty(googleUserInfo.email)) {
                user.username = googleUserInfo.email;
            }

            await user.save();
        }

        logger.debug({ googleSub: googleUserInfo.sub, googleEmail: googleUserInfo.email, userUid: user.uid },
            "GoogleAuthenticationService.findOrCreateUser: successfully retrieved user");

        return user;
    }
}

export const instance = new GoogleAuthenticationService();
export default instance;

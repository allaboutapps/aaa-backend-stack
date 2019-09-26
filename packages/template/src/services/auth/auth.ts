import * as _ from "lodash";

import logger from "@aaa-backend-stack/logger";
import { BASE as Base, BOOM as Boom, HAPI as Hapi, JOI as Joi } from "@aaa-backend-stack/rest";
import * as serverdate from "@aaa-backend-stack/serverdate";
import storage, { IInstances } from "@aaa-backend-stack/storage";

import { ZXCVBN } from "@aaa-backend-stack/utils";
import { CONFIG } from "../../configure";
import mailService from "../mailService";
import * as errors from "./_errors";
import * as types from "./_types";
import FacebookAuthenticationService from "./facebook";
import GoogleAuthenticationService from "./google";
import LocalAuthenticationService from "./local";

export class AuthenticationService {
    async authenticate(
        authType: types.IAuthenticationType,
        payload: types.AuthenticationPayload,
        scopes: string[] = [],
        generateAuthTokens: boolean = true
    ): Promise<types.IAuthenticationResult> {
        logger.debug({ authType, generateAuthTokens }, "AuthenticationService.authenticate: performing authentication");

        let localPayload = payload;
        let user: IInstances.IUser = null;
        switch (authType) {
            case types.AUTHENTICATION_TYPES.facebook:
                localPayload = this.validateAuthenticationPayload(localPayload, types.AuthenticationPayloadFacebookSchema);
                user = await FacebookAuthenticationService.authenticate(<types.IAuthenticationPayloadFacebook>localPayload);
                break;
            case types.AUTHENTICATION_TYPES.google:
                localPayload = this.validateAuthenticationPayload(localPayload, types.AuthenticationPayloadGoogleSchema);
                user = await GoogleAuthenticationService.authenticate(<types.IAuthenticationPayloadGoogle>localPayload);
                break;
            case types.AUTHENTICATION_TYPES.local:
                localPayload = this.validateAuthenticationPayload(localPayload, types.AuthenticationPayloadLocalSchema);
                user = await LocalAuthenticationService.authenticate(<types.IAuthenticationPayloadLocal>localPayload);
                break;
            case types.AUTHENTICATION_TYPES.refreshToken:
                localPayload = this.validateAuthenticationPayload(localPayload, types.AuthenticationPayloadRefreshTokenSchema);
                user = await LocalAuthenticationService.authenticateWithRefreshToken((<types.IAuthenticationPayloadRefreshToken>localPayload).refreshToken);
                break;
            default:
                logger.warn({ authType, generateAuthTokens }, "AuthenticationService.authenticate: invalid auth type, rejecting authentication");

                throw Boom.badImplementation("Invalid auth type");
        }

        if (_.isNil(user)) {
            logger.debug({ authType, generateAuthTokens }, "AuthenticationService.authenticate: no user found, rejecting authentication");

            throw Base.createBoom(authType === types.AUTHENTICATION_TYPES.refreshToken ?
                errors.UNAUTHORIZED_INVALID_REFRESH_TOKEN : errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
        }

        if (!_.isEmpty(scopes)) {
            const userScopes = await user.getScopeJsonArray();

            if (_.some(scopes, (scope) => !_.includes(userScopes, scope))) {
                logger.debug({ authType, generateAuthTokens, userUid: user.uid, scopes, userScopes },
                    "AuthenticationService.authenticate: user does not have required scopes, rejecting authentication");

                throw Base.createBoom(authType === types.AUTHENTICATION_TYPES.refreshToken ?
                    errors.UNAUTHORIZED_INVALID_REFRESH_TOKEN : errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
            }
        }

        logger.debug({ authType, generateAuthTokens, userUid: user.uid }, "AuthenticationService.authenticate: successfully performed authentication");

        if (generateAuthTokens) {
            return this.generateAuthTokens(user);
        }

        return {
            user: user,
            accessToken: null,
            refreshToken: null
        };
    }

    async createGuestUser(): Promise<types.IAuthenticationResult> {
        if (!CONFIG.auth.allowGuestAuth) {
            logger.debug("AuthenticationService.createGuestUser: guest user authentication is disabled, aborting creation");

            throw Base.createBoom(errors.FORBIDDEN_GUEST_AUTHENTICATION_DISABLED);
        }

        logger.debug("AuthenticationService.createGuestUser: creating guest user");

        const user = await LocalAuthenticationService.createGuestUser();

        logger.debug({ userUid: user.uid }, "AuthenticationService.createGuestUser: successfully created guest user");

        return this.generateAuthTokens(user);
    }

    async generateAuthTokens(userOrUserUid: IInstances.IUser | string, createGuestAccessToken: boolean = true): Promise<types.IAuthenticationResult> {
        let user: IInstances.IUser;
        if (_.isString(userOrUserUid)) {
            user = await storage.models.User.findById(userOrUserUid);
        } else {
            user = userOrUserUid;
        }

        if (_.isNil(user)) {
            logger.warn({ userUid: _.isString(userOrUserUid) ? userOrUserUid : userOrUserUid.uid, createGuestAccessToken },
                "AuthenticationService.generateAuthTokens: user not found");

            throw Boom.notFound("User not found");
        }

        logger.debug({ userUid: user.uid, createGuestAccessToken }, "AuthenticationService.generateAuthTokens: generating tokens for user");

        let accessToken: IInstances.IAccessToken = null;
        let refreshToken: IInstances.IRefreshToken = null;
        if (user.isGuest()) {
            accessToken = await storage.models.AccessToken.findOne({
                where: {
                    UserUid: user.uid,
                    validUntil: null
                }
            });

            if (_.isNil(accessToken) && createGuestAccessToken) {
                logger.debug({ userUid: user.uid, createGuestAccessToken }, "AuthenticationService.generateAuthTokens: generating access token for guest user");

                accessToken = await storage.models.AccessToken.create({
                    UserUid: user.uid,
                    validUntil: null
                });
            }
        } else {
            [accessToken, refreshToken] = await Promise.all([
                user.getNewAccessToken(),
                user.getNewRefreshToken()
            ]);
        }

        logger.debug({ userUid: user.uid }, "AuthenticationService.generateAuthTokens: successfully generated tokens for user");

        return {
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    }

    async logout(
        userOrUserUid: IInstances.IUser | string,
        accessTokenOrToken: IInstances.IAccessToken | string,
        refreshTokenOrToken: IInstances.IRefreshToken | string | null,
        destroyGuestUsers: boolean = true
    ): Promise<void> {
        let user: IInstances.IUser;
        if (_.isString(userOrUserUid)) {
            user = await storage.models.User.findById(userOrUserUid);
        } else {
            user = userOrUserUid;
        }

        if (_.isNil(user)) {
            logger.warn({ userUid: _.isString(userOrUserUid) ? userOrUserUid : userOrUserUid.uid, destroyGuestUsers }, "AuthenticationService.logout: user not found");

            throw Boom.notFound("User not found");
        }

        logger.debug({ userUid: user.uid, destroyGuestUsers }, "AuthenticationService.logout: performing logout");

        let accessToken: IInstances.IAccessToken;
        if (_.isString(accessTokenOrToken)) {
            accessToken = await storage.models.AccessToken.findOne({
                where: {
                    token: accessTokenOrToken,
                    UserUid: user.uid
                }
            });
        } else {
            accessToken = accessTokenOrToken;
        }

        if (_.isNil(accessToken)) {
            logger.debug({ userUid: user.uid, destroyGuestUsers }, "AuthenticationService.logout: did not find access token to delete, rejecting logout");

            throw Base.createBoom(errors.FORBIDDEN_INVALID_LOGOUT);
        } else if (accessToken.UserUid !== user.uid) {
            logger.debug({ userUid: user.uid, destroyGuestUsers, accessTokenUserUid: accessToken.UserUid },
                "AuthenticationService.logout: provided access token does not belong to requesting user, rejecting logout");

            throw Base.createBoom(errors.FORBIDDEN_INVALID_LOGOUT);
        }

        let refreshToken: IInstances.IRefreshToken;
        if (_.isString(refreshTokenOrToken)) {
            refreshToken = await storage.models.RefreshToken.findOne({
                where: {
                    token: refreshTokenOrToken,
                    UserUid: user.uid
                }
            });
        } else {
            refreshToken = refreshTokenOrToken;
        }

        if (_.isNil(refreshToken) && !_.isNil(refreshTokenOrToken)) {
            logger.debug({ userUid: user.uid, destroyGuestUsers }, "AuthenticationService.logout: did not find refresh token to delete, rejecting logout");

            throw Base.createBoom(errors.FORBIDDEN_INVALID_LOGOUT);
        } else if (!_.isNil(refreshToken) && refreshToken.UserUid !== user.uid) {
            logger.debug({ userUid: user.uid, destroyGuestUsers, refreshTokenUserUid: refreshToken.UserUid },
                "AuthenticationService.logout: provided refresh token does not belong to requesting user, rejecting logout");

            throw Base.createBoom(errors.FORBIDDEN_INVALID_LOGOUT);
        }

        return storage.transaction(async () => {
            if (!_.isNil(refreshToken)) {
                await refreshToken.destroy();
            }

            await accessToken.destroy();

            if (destroyGuestUsers && user.isGuest()) {
                logger.debug({ userUid: user.uid, destroyGuestUsers }, "AuthenticationService.logout: destroying guest user");
                await user.destroy();
            }

            logger.debug({ userUid: user.uid, destroyGuestUsers }, "AuthenticationService.logout: successfully performed logout");
        });
    }

    async register(payload: types.IRegistrationPayload, generateAuthTokens: boolean = true): Promise<types.IAuthenticationResult> {
        logger.debug("AuthenticationService.register: performing local registration");

        let localPayload = payload;
        localPayload = this.validateRegistrationPayload(localPayload);

        const user = await LocalAuthenticationService.register(localPayload);

        logger.debug({ generateAuthTokens, userUid: user.uid }, "AuthenticationService.register: successfully performed registration");

        if (generateAuthTokens) {
            return this.generateAuthTokens(user);
        }

        return {
            user: user,
            accessToken: null,
            refreshToken: null
        };
    }

    async initiatePasswordReset(username: string): Promise<boolean> {
        const user = await storage.models.User.findOne({ where: { username: username } });
        if (_.isNil(user)) {
            logger.warn({ username }, "AuthenticationService.initiatePasswordReset: user not found, aborting");

            await this.preventTimingAttack();

            return false;
        }

        if (!user.isActive) {
            logger.warn({ userUid: user.uid }, "AuthenticationService.initiatePasswordReset: user deactivated, aborting");

            await this.preventTimingAttack();

            return false;
        }

        let passwordResetToken = await storage.models.PasswordResetToken.findOne({
            where: {
                UserUid: user.uid,
                validUntil: {
                    $gt: serverdate.getMoment().add(1, "minute").toDate()
                }
            }
        });

        if (_.isNil(passwordResetToken)) {

            // Pen-Testing:prevent emails for invalid email addresses to be forwared!
            const validationResult = Joi.validate(user.username, Joi.string().email().required());

            if (!_.isNil(validationResult.error)) {

                logger.warn({ userUid: user.uid, username: user.username }, "AuthenticationService.initiatePasswordReset: user.username is not a valid email address");

                await this.preventTimingAttack();

                return false;
            }

            passwordResetToken = await storage.models.PasswordResetToken.create({
                UserUid: user.uid,
                validUntil: serverdate.getMoment().add(CONFIG.auth.passwordResetTokenValidity, "seconds").toDate()
            });

            try {
                await mailService.sendPasswordForgot(user.username, passwordResetToken.token);
            } catch (err) {
                logger.warn({ userUid: user.uid, err }, "AuthenticationService.initiatePasswordReset: failed to send password forgot email");

                await this.preventTimingAttack();

                return false; // Pen-Testing: don't expose failed fails to send email for user (exposes which users the system has!)
            }
        }

        logger.debug({ userUid: user.uid }, "AuthenticationService.initiatePasswordReset: successfully initiated password reset");

        return true;
    }

    async completePasswordReset(
        payload: types.IPasswordResetPayload,
        generateAuthTokens: boolean = true,
        reply: Hapi.ReplyWithContinue = null
    ): Promise<types.IAuthenticationResult | null> {
        logger.debug("AuthenticationService.completePasswordReset: completing local password reset");

        let localPayload = payload;
        localPayload = this.validatePasswordResetPayload(localPayload);

        if (payload.password !== payload.passwordConfirmation) {
            logger.debug("AuthenticationService.completePasswordReset: password confirmation mismatch, aborting");

            await this.preventTimingAttack();

            if (_.isNil(reply)) {
                throw Base.createBoom(errors.CONFLICT_PASSWORD_CONFIRMATION_MISMATCH);
            } else {
                reply.view("web/passwordReset.hbs", {
                    token: payload.token,
                    error: "Error: Provided password and password confirmation do not match."
                }).code(409);

                return null;
            }
        }

        if (CONFIG.auth.passwordStrengthMinimumScore > 0) {
            const passwordInfo = ZXCVBN(payload.password);
            if (passwordInfo.score < CONFIG.auth.passwordStrengthMinimumScore) {
                logger.debug({ minimumPasswordScore: CONFIG.auth.passwordStrengthMinimumScore, passwordScore: passwordInfo.score },
                    "AuthenticationService.completePasswordReset: provided password does not meet password requirements, rejecting reset");

                await this.preventTimingAttack();

                if (_.isNil(reply)) {
                    throw Base.createBoom(errors.CONFLICT_WEAK_PASSWORD, {
                        score: passwordInfo.score,
                        warning: passwordInfo.feedback ? passwordInfo.feedback.warning : undefined
                    });
                } else {
                    const passwordFeedback = passwordInfo.feedback && !_.isEmpty(passwordInfo.feedback.warning) ? passwordInfo.feedback.warning : "";

                    reply.view("web/passwordReset.hbs", {
                        token: payload.token,
                        error: `Error: Given password does not meet minimum password strength requirements. ${passwordFeedback}`
                    }).code(409);

                    return null;
                }
            }
        }

        const passwordResetToken = await storage.models.PasswordResetToken.findOne({
            where: {
                token: payload.token,
                validUntil: {
                    $gte: serverdate.getMoment().toISOString()
                }
            },
            include: [{
                model: storage.models.User,
                required: true
            }]
        });
        if (_.isNil(passwordResetToken)) {
            logger.debug("AuthenticationService.completePasswordReset: reset token not found, aborting");

            await this.preventTimingAttack();

            if (_.isNil(reply)) {
                throw Base.createBoom(errors.NOT_FOUND_INVALID_PASSWORD_RESET_TOKEN);
            } else {
                reply.view("web/passwordReset.hbs", {
                    token: payload.token,
                    error: "Error: Invalid password reset token."
                }).code(404);

                return null;
            }
        }

        return storage.transaction(async () => {
            const user = passwordResetToken.User;

            // All checks passed, set new user's password, but delete password reset token first
            await passwordResetToken.destroy();

            // Ensure password has been hashed properly and salt is stored in database
            await user.setPassword(payload.password);

            await user.save();

            logger.debug({ userUid: user.uid, generateAuthTokens }, "AuthenticationService.completePasswordReset: successfully completed local password reset");

            let authenticationResult: types.IAuthenticationResult = {
                user: user,
                accessToken: null,
                refreshToken: null
            };
            if (generateAuthTokens) {
                authenticationResult = await this.generateAuthTokens(user);
            }

            if (!_.isNil(reply)) {
                reply.view("web/passwordReset.hbs", {
                    token: payload.token,
                    success: "Successfully updated password."
                });
            }

            return authenticationResult;
        });
    }

    async preventTimingAttack(): Promise<void> {
        return LocalAuthenticationService.preventTimingAttack();
    }

    private validateAuthenticationPayload(payload: types.AuthenticationPayload, schema: Joi.Schema): types.AuthenticationPayload {
        const validationResult = Joi.validate(payload, schema);
        if (!_.isNil(validationResult.error)) {
            throw Base.createBoom(errors.BAD_REQUEST_INVALID_AUTHENTICATION_PAYLOAD);
        }

        return payload;
    }

    private validateRegistrationPayload(payload: types.IRegistrationPayload): types.IRegistrationPayload {
        const validationResult = Joi.validate(payload, types.RegistrationPayloadSchema);
        if (!_.isNil(validationResult.error)) {
            throw Base.createBoom(errors.BAD_REQUEST_INVALID_REGISTRATION_PAYLOAD);
        }

        return payload;
    }

    private validatePasswordResetPayload(payload: types.IPasswordResetPayload): types.IPasswordResetPayload {
        const validationResult = Joi.validate(payload, types.PasswordResetPayloadSchema);
        if (!_.isNil(validationResult.error)) {
            throw Base.createBoom(errors.BAD_REQUEST_INVALID_PASSWORD_RESET_PAYLOAD);
        }

        return payload;
    }
}

export const instance = new AuthenticationService();

export default instance;

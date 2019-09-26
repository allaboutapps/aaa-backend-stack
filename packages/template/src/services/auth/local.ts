import * as _ from "lodash";

import logger from "@aaa-backend-stack/logger";
import { BASE as Base } from "@aaa-backend-stack/rest";
import * as serverdate from "@aaa-backend-stack/serverdate";
import storage, { IInstances } from "@aaa-backend-stack/storage";
import { ZXCVBN } from "@aaa-backend-stack/utils";

import CONFIG from "../../configure";
import * as errors from "./_errors";
import { IAuthenticationPayloadLocal, IRegistrationPayload } from "./_types";

export class LocalAuthenticationService {
    async authenticate(payload: IAuthenticationPayloadLocal): Promise<IInstances.IUser> {
        logger.debug({ username: payload.username }, "LocalAuthenticationService.authenticate: performing local authentication");

        // Users can only login in locally if they have a password and salt set - guests and OpenID users have `null` as both values
        const user: IInstances.IUser = await storage.models.User.find({
            where: {
                username: payload.username,
                password: {
                    $ne: null
                },
                salt: {
                    $ne: null
                }
            }
        });

        if (_.isNil(user)) {
            logger.debug({ username: payload.username }, "LocalAuthenticationService.authenticate: no user with provided username found, rejecting authentication");

            await this.preventTimingAttack();

            throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
        }

        if (!user.isActive) {
            logger.debug({ username: payload.username, userUid: user.uid }, "LocalAuthenticationService.authenticate: user is deactivated, rejecting authentication");

            await this.preventTimingAttack();

            throw Base.createBoom(errors.FORBIDDEN_USER_DEACTIVATED);
        }

        const hashedPassword = await CONFIG.hashing.hashPassword(payload.password, user.salt);
        if (hashedPassword !== user.password) {
            logger.debug({ username: payload.username, userUid: user.uid }, "LocalAuthenticationService.authenticate: password does not match, rejecting authentication");

            await this.preventTimingAttack();

            throw Base.createBoom(errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS);
        }

        logger.debug({ username: payload.username, userUid: user.uid }, "LocalAuthenticationService.authenticate: successfully performed local authentication");

        return user;
    }

    async authenticateWithRefreshToken(token: string): Promise<IInstances.IUser> {
        logger.debug("LocalAuthenticationService.authenticateWithRefreshToken: performing local authentication");

        const refreshToken = await storage.models.RefreshToken.findOne({
            where: {
                token: token
            },
            include: [{
                model: storage.models.User
            }]
        });

        if (_.isNil(refreshToken)) {
            logger.debug("LocalAuthenticationService.authenticateWithRefreshToken: refresh token not found, rejecting authentication");

            await this.preventTimingAttack();

            throw Base.createBoom(errors.UNAUTHORIZED_INVALID_REFRESH_TOKEN);
        }

        if (CONFIG.auth.refreshTokenValidityMS > 0 &&
            serverdate.getMoment(refreshToken.createdAt).add(CONFIG.auth.refreshTokenValidityMS, "milliseconds").isBefore(serverdate.getMoment())) {
            logger.debug({ userUid: refreshToken.User.uid }, "LocalAuthenticationService.authenticateWithRefreshToken: refresh token has expired, rejecting authentication");

            // tslint:disable-next-line:no-floating-promises
            refreshToken.destroy().then(() => {
                logger.debug({ userUid: refreshToken.User.uid },
                    "LocalAuthenticationService.authenticateWithRefreshToken: successfully deleted expired refresh token (out of chain)");
            }).catch((err) => {
                logger.warn({ userUid: refreshToken.User.uid, err: err },
                    "LocalAuthenticationService.authenticateWithRefreshToken: failed to delete expired refresh token (out of chain)");
            });

            await this.preventTimingAttack();

            throw Base.createBoom(errors.UNAUTHORIZED_INVALID_REFRESH_TOKEN);
        }

        if (!refreshToken.User.isActive) {
            logger.debug({ userUid: refreshToken.User.uid }, "LocalAuthenticationService.authenticateWithRefreshToken: user is deactivated, rejecting authentication");

            await this.preventTimingAttack();

            throw Base.createBoom(errors.FORBIDDEN_USER_DEACTIVATED);
        }

        const user = refreshToken.User;

        // Invalidate refresh token, new one will be generated
        await refreshToken.destroy();

        logger.debug({ userUid: refreshToken.User.uid }, "LocalAuthenticationService.authenticateWithRefreshToken: successfully performed local authentication");

        return user;
    }

    async createGuestUser(): Promise<IInstances.IUser> {
        if (!CONFIG.auth.allowGuestAuth) {
            logger.debug("LocalAuthenticationService.createGuestUser: guest user authentication is disabled, aborting creation");

            throw Base.createBoom(errors.FORBIDDEN_GUEST_AUTHENTICATION_DISABLED);
        }

        logger.debug("LocalAuthenticationService.createGuestUser: creating local guest user");

        return storage.transaction(async () => {
            // Guest users have no information (beside a UID) stored in the database
            const user = await storage.models.User.create();

            await user.createAppUserProfile();

            logger.debug({ userUid: user.uid }, "LocalAuthenticationService.createGuestUser: successfully created local guest user");

            return user;
        });
    }

    async register(payload: IRegistrationPayload): Promise<IInstances.IUser> {
        logger.debug({ username: payload.username }, "LocalAuthenticationService.register: performing local registration");

        const existingCount = await storage.models.User.count({
            where: {
                username: payload.username
            }
        });
        if (existingCount > 0) {
            logger.debug({ username: payload.username }, "LocalAuthenticationService.register: existing user with provided username found, rejecting registration");

            throw Base.createBoom(errors.CONFLICT_USERNAME_EXISTS);
        }

        if (CONFIG.auth.passwordStrengthMinimumScore > 0) {
            const passwordInfo = ZXCVBN(payload.password);
            if (passwordInfo.score < CONFIG.auth.passwordStrengthMinimumScore) {
                logger.debug({ username: payload.username, minimumPasswordScore: CONFIG.auth.passwordStrengthMinimumScore, passwordScore: passwordInfo.score },
                    "LocalAuthenticationService.register: provided password does not meet password requirements, rejecting registration");

                throw Base.createBoom(errors.CONFLICT_WEAK_PASSWORD, {
                    score: passwordInfo.score,
                    warning: passwordInfo.feedback ? passwordInfo.feedback.warning : undefined
                });
            }
        }

        return storage.transaction(async () => {
            const user = storage.models.User.build(payload);

            // Ensure password has been hashed properly and salt is stored in database
            await user.setPassword(payload.password);

            await user.save();

            await user.createAppUserProfile();

            logger.debug({ username: payload.username, userUid: user.uid }, "LocalAuthenticationService.register: successfully performed local registration");

            return user;
        });
    }

    async preventTimingAttack(): Promise<void> {
        await Promise.delay(_.random(CONFIG.auth.timingAttack.min, CONFIG.auth.timingAttack.max));
    }
}

export const instance = new LocalAuthenticationService();
export default instance;

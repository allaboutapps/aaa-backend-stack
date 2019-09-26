import * as _ from "lodash";

import logger from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";
import * as serverdate from "@aaa-backend-stack/serverdate";
import { IInstances } from "@aaa-backend-stack/storage";

import { IAppUserProfileInstance } from "../../models/AppUserProfile";
import { LEGAL_ACCEPTED_AT_AFTER_MAX, LEGAL_ACCEPTED_AT_BACK_TO_NULL_ERROR, LEGAL_ACCEPTED_AT_BEFORE_SAVED } from "./_errors";
import { UserLegal } from "./_types";

@REST.controller("/api/v1")
export class AppUser extends REST.SERVER.MethodController {

    @REST.get("/user/legal")
    @REST.authScope(["user", "guest"])
    @REST.documentation({
        description: "Gets current user gdpr and legal settings",
        tags: ["app"],
        statusCodes: [
            REST.BOOM.notFound
        ]
    })
    @REST.response({
        schema: UserLegal.required()
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async getUserLegal(request: REST.HAPI.Request) {
        const user: IInstances.IUser = request.auth.credentials.user;
        const appUserProfile = await user.getAppUserProfile();

        if (!appUserProfile) {
            throw REST.BOOM.notFound();
        }

        const { hasGDPROptOut, legalAcceptedAt } = appUserProfile;

        return {
            hasGDPROptOut,
            legalAcceptedAt
        };
    }

    @REST.patch("/user/legal")
    @REST.authScope(["user", "guest"])
    @REST.documentation({
        description: "Updates user gdpr and legal settings",
        // tslint:disable-next-line:no-multiline-string
        notes: `patching \`legalAcceptedAt\` underlies certain constraints (these are not supported and result in an 400):
                * > tommorow-end-on-day
                * smaller than we have already patched (same value is fine)
                * to null again after it was already set`,
        tags: ["app"],
        statusCodes: [
            LEGAL_ACCEPTED_AT_BACK_TO_NULL_ERROR,
            LEGAL_ACCEPTED_AT_AFTER_MAX,
            LEGAL_ACCEPTED_AT_BEFORE_SAVED,
            REST.BOOM.notFound
        ]
    })
    @REST.response({
        schema: UserLegal.required()
    })
    @REST.validate({
        payload: REST.JOI.object().required().keys({
            hasGDPROptOut: REST.JOI.bool().optional().description("wheather the user has opted out from third party services"),
            legalAcceptedAt: REST.types.iso8601Datestring.allow(null).optional().description("when the user has last accepted the legal terms, might be null")
        }).unknown().label("UserLegalPatch").description("Patch legal information about an AppUser (everything is opt)")
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    @REST.forwardBoomErrorPayloads
    async patchUserLegal(request: REST.HAPI.Request) {
        const user: IInstances.IUser = request.auth.credentials.user;
        const appUserProfile = await user.getAppUserProfile();

        if (!appUserProfile) {
            throw REST.BOOM.notFound();
        }

        await setGDPRFlags(request.payload, appUserProfile, false); // false, flags are not mandadory in this case

        const { hasGDPROptOut, legalAcceptedAt } = appUserProfile;

        return {
            hasGDPROptOut,
            legalAcceptedAt
        };
    }

}

export interface IGDPRPayload {
    hasGDPROptOut?: boolean;
    legalAcceptedAt?: Date;
}

export async function setGDPRFlags(payload: IGDPRPayload, appUserProfile: IAppUserProfileInstance, forceAvailable: boolean = true): Promise<IAppUserProfileInstance> {

    if (forceAvailable === true
        && (_.isUndefined(payload.hasGDPROptOut) || _.isUndefined(payload.legalAcceptedAt))) {

        logger.fatal({
            payload,
            appUserProfile,
            forceAvailable
        }, "setGDPRFlag: The flags hasGDPROptOut and legalAcceptedAt have been explicitly defined as being present but were not!");

        // the flags have been defined as present, server error!
        throw new Error("setGDPRFlag: The flags hasGDPROptOut and legalAcceptedAt have been explicitly defined as being present but were not!");
    }

    if (_.isUndefined(payload.hasGDPROptOut) === false) {
        appUserProfile.hasGDPROptOut = payload.hasGDPROptOut;
    }

    if (_.isUndefined(payload.legalAcceptedAt) === false) {
        await performLegalAcceptedAtHandling(payload.legalAcceptedAt, appUserProfile);
    }

    await appUserProfile.save();
    await appUserProfile.reload();

    return appUserProfile;
}

// side-effect: sets legalAcceptedAt on the AppUserProfile according to the above rules
// attention, this does not save the AppUserProfile!
async function performLegalAcceptedAtHandling(legalAcceptedAt: null | Date, appUserProfile: IAppUserProfileInstance): Promise<IAppUserProfileInstance> {
    const savedMoment = serverdate.getMoment(appUserProfile.legalAcceptedAt);
    const maxMoment = serverdate.getMoment().add(1, "day").endOf("day"); // allowed to set max 1 day in the future
    const newMoment = serverdate.getMoment(legalAcceptedAt);

    if (savedMoment.isValid() === true
        && newMoment.isValid() === false) {
        // patch back to null is not allowed.
        throw REST.BASE.createBoom(LEGAL_ACCEPTED_AT_BACK_TO_NULL_ERROR);
    } else if (newMoment.isValid() && newMoment.isAfter(maxMoment)) {
        throw REST.BASE.createBoom(LEGAL_ACCEPTED_AT_AFTER_MAX, { maxMoment: maxMoment.toISOString() });
    } else if (savedMoment.isValid() && newMoment.isValid()) {
        // both moments have a valid time, lets check if they comply...
        if (newMoment.isBefore(savedMoment)) {
            throw REST.BASE.createBoom(LEGAL_ACCEPTED_AT_BEFORE_SAVED, {
                savedMoment: savedMoment.toISOString()
            });
        }
    }

    // all right?, set it.
    appUserProfile.legalAcceptedAt = legalAcceptedAt;

    return appUserProfile;
}

export default new AppUser();

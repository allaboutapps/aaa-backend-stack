import { JOI, types } from "@aaa-backend-stack/rest";

export const UserLegal = JOI.object().required().keys({
    hasGDPROptOut: JOI.bool().required().description("wheather the user has opted out from third party services"),
    legalAcceptedAt: types.iso8601Datestring.allow(null).required().description("when the user has last accepted the legal terms, might be null")
}).label("UserLegal").description("Provides legal information about an AppUser");

// AppUserProfile builds on top of legal scheme, for easier clientside consumption
export const AppUserProfile = UserLegal.required().keys({
    uid: types.uidv4.required(),
    scope: JOI.array().items(JOI.string()).required().description("The scope (roles & permissions) of this user.")
    // ... your custom fields
}).label("AppUserProfile").description("Provides all profile information about an AppUser");

export const AppUserProfilePatchRequest = JOI.object().required().unknown(true).keys({
    // define the allowed keys to patch here... e.g.:
    // email: types.email.optional().allow(null).description("set to null to remove, no empty string allowed"),
    // phone: Joi.string().optional().allow(null).max(20).trim().description("null to remove, no empty string allowed")
}).label("AppUserProfilePatchRequest")
    .description("Available fields to directly patch an AppUserProfile, unknown keys are allowed (whole modified AppUserProfile can be sent), but dismissed.");

export interface IPublicAppUserProfile {
    uid: string;
}

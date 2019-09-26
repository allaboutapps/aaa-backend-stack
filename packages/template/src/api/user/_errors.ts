import * as REST from "@aaa-backend-stack/rest";

export const LEGAL_ACCEPTED_AT_BACK_TO_NULL_ERROR: REST.BASE.IStatusCodeDefinition = {
    code: 400,
    message: "legalAcceptedAt is not allowed to be patched back to null as it's already set.",
    errorType: "LEGAL_ACCEPTED_AT_BACK_TO_NULL_ERROR"
};

export const LEGAL_ACCEPTED_AT_AFTER_MAX: REST.BASE.IStatusCodeDefinition = {
    code: 400,
    message: "legalAcceptedAt is after max allowed date",
    errorType: "LEGAL_ACCEPTED_AT_AFTER_MAX"
};

export const LEGAL_ACCEPTED_AT_BEFORE_SAVED: REST.BASE.IStatusCodeDefinition = {
    code: 400,
    message: "your legalAcceptedAt is before the already saved date",
    errorType: "LEGAL_ACCEPTED_AT_BEFORE_SAVED"
};

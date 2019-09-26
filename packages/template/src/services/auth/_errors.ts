import * as REST from "@aaa-backend-stack/rest";

export const BAD_REQUEST_INVALID_AUTHENTICATION_PAYLOAD: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid authentication payload",
    code: 400,
    errorType: "invalidAuthenticationPayload"
};
export const BAD_REQUEST_INVALID_PASSWORD_RESET_PAYLOAD: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid password reset payload",
    code: 400,
    errorType: "invalidPasswordResetPayload"
};
export const BAD_REQUEST_INVALID_REGISTRATION_PAYLOAD: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid registration payload",
    code: 400,
    errorType: "invalidRegistrationPayload"
};
export const UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid login credentials",
    code: 401,
    errorType: "invalidCredentials"
};
export const UNAUTHORIZED_INVALID_REFRESH_TOKEN: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid refresh token",
    code: 401,
    errorType: "invalidRefreshToken"
};
export const FORBIDDEN_FACEBOOK_AUTHENTICATION_DISABLED: REST.BASE.IStatusCodeDefinition = {
    message: "Facebook authentication is disabled",
    code: 403,
    errorType: "facebookAuthDisabled"
};
export const FORBIDDEN_GOOGLE_AUTHENTICATION_DISABLED: REST.BASE.IStatusCodeDefinition = {
    message: "Google authentication is disabled",
    code: 403,
    errorType: "googleAuthDisabled"
};
export const FORBIDDEN_GUEST_AUTHENTICATION_DISABLED: REST.BASE.IStatusCodeDefinition = {
    message: "Guest authentication is disabled",
    code: 403,
    errorType: "guestAuthDisabled"
};
export const FORBIDDEN_INVALID_LOGOUT: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid logout request",
    code: 403,
    errorType: "invalidLogout"
};
export const FORBIDDEN_USER_DEACTIVATED: REST.BASE.IStatusCodeDefinition = {
    message: "User deactivated",
    code: 403,
    errorType: "userDeactivated"
};
export const FORBIDDEN_USER_NOT_LOCAL: REST.BASE.IStatusCodeDefinition = {
    message: "User does not have local user account",
    code: 403,
    errorType: "userNotLocal"
};
export const NOT_FOUND_INVALID_PASSWORD_RESET_TOKEN: REST.BASE.IStatusCodeDefinition = {
    message: "Invalid password reset token",
    code: 404,
    errorType: "invalidPasswordResetToken"
};
export const CONFLICT_EMAIL_FAILURE: REST.BASE.IStatusCodeDefinition = {
    message: "Failed to send email",
    code: 409,
    errorType: "emailFailure"
};
export const CONFLICT_PASSWORD_CONFIRMATION_MISMATCH: REST.BASE.IStatusCodeDefinition = {
    message: "Provided password and password confirmation do not match",
    code: 409,
    errorType: "passwordConfirmationMismatch"
};
export const CONFLICT_USERNAME_EXISTS: REST.BASE.IStatusCodeDefinition = {
    message: "User with the given username already exists",
    code: 409,
    errorType: "usernameExists"
};
export const CONFLICT_WEAK_PASSWORD: REST.BASE.IStatusCodeDefinition = {
    message: "Given password does not meet minimum password strength requirements",
    code: 409,
    errorType: "weakPassword"
};

import { JOI, types } from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";

export const AuthResponse = JOI.object().required().keys({
    refreshToken: types.uidv4.allow(null).required().description("A token for this user that can be used to get a new accessToken using the /auth/token endpoint. This token " +
        "might change over time, so for a new login, or when exchanging a refreshToken for a new accessToken a new refreshToken might be generated. Guest users don't receive " +
        "a refreshToken (will be null)"),
    accessToken: types.uidv4.required().description("The main authorization token for API usage. This token has to be provided with the Authorization HTTP header as Bearer for " +
        "all authenticated calls. Only valid for a limited time - see validUntil"),
    expiresIn: JOI.number().integer().required()
        .description("Time in seconds how long the Access Token will be valid on the server. Guest users will have an accessToken that never expires (-1)"),
    tokenType: JOI.string().required().description("a string that tells you what type of token it is. You should use this type in your Authorization requests.")
}).label("AuthResponse").description("The standard response for all authentication related calls, containing authentication tokens and token information");

export const FacebookLoginRequest = JOI.object().required().keys({
    token: JOI.string().min(1).required().description("(ID) token returned by Facebook SDK upon successful (client-side) login")
}).label("FacebookLoginRequest").description("Payload required for performing Facebook authentication");

export const GoogleLoginRequest = JOI.object().required().keys({
    idToken: JOI.string().min(1).required().description("ID token returned by Google SDK upon successful (client-side) login")
}).label("GoogleLoginRequest").description("Payload required for performing Google authentication");

export const LocalLoginRequest = JOI.object().required().keys({
    username: types.username.required().description("Username of local user account"),
    password: types.password.required().description("(Plaintext) password of local user account"),
    scope: JOI.string().default(CONFIG.auth.scope.userScopeIdentifier).optional()
        .description(`Scope (=== permission/role) the user wants to authenticate against (defaults to "${CONFIG.auth.scope.userScopeIdentifier}" if omitted`)
}).label("LocalLoginRequest").description("Payload required for performing local authentication");

export const LogoutRequest = JOI.object().allow(null).default(null).optional().keys({
    refreshToken: types.uidv4.allow(null).default(null).optional().description("Optional refresh token to destroy while performing logout (can be omitted for guest accounts)")
}).label("LogoutRequest").description("Payload or query parameters for logging a user out locally");

export const RefreshTokenRequest = JOI.object().required().keys({
    refreshToken: types.uidv4.required().description("Refresh token to use for regenerating auth tokens")
}).label("RefreshTokenRequest").description("Payload required for performing auth token refresh");

export const RegisterRequest = JOI.object().required().keys({
    username: types.username.required().description("Username of new user account"),
    password: types.password.required().description("(Plaintext) password of new user account")
}).label("RegisterRequest").description("Payload required for registering a new local user account");

export const InitiatePasswordResetRequest = JOI.object().required().keys({
    username: types.username.required().description("Username of user account to initiate password reset for")
}).label("InitiatePasswordResetRequest").description("Payload required for initiating a password reset of a local user account");

export const InitiatePasswordResetResponse = JOI.object().required().keys({
    success: JOI.bool().valid(true).description("Indicates success of the password reset initialisation, will always be `true`")
}).label("InitiatePasswordResetResponse").description("Response returned after initiating a password reset of a local user account");

export const CompletePasswordResetRequest = JOI.object().required().keys({
    token: types.uidv4.required().description("Password reset token provided via reset email"),
    password: types.password.required().description("New (plaintext) password to set for user account"),
    passwordConfirmation: types.password.required().description("Confirmation of new (plaintext) password to set for user account")
}).label("CompletePasswordResetRequest").description("Payload required for completing the password reset of a local user account");

export const AuthProfile = JOI.object().keys({
    uid: types.uidv4.required(),
    username: JOI.string().allow(null).optional()
        .description("Supplied unique username, this value will be used for password authentication, optional (null for users who cannot use password authentication)"),
    scope: JOI.array().items(JOI.string()).required().description("The scope (roles & permissions) of this user.")
}).label("AuthProfile").description("The user info object, providing only auth-specific / scope permission information of this user");

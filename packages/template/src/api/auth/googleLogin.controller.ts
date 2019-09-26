import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import AuthenticationService, { AUTHENTICATION_TYPES, IAuthenticationPayloadGoogle } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { AuthResponse, GoogleLoginRequest } from "./_types";

@REST.controller("/api/v1")
class AuthGoogleLogin extends REST.SERVER.MethodController {
    @REST.post("/auth/google")
    @REST.noAuth
    @REST.documentation({
        description: `${CONFIG.auth.google.enabled ? "" : "[GOOGLE AUTH DISABLED] "}Performs login using a Google ID token`,
        // tslint:disable:no-multiline-string
        notes: `${CONFIG.auth.google.enabled ? "" : "**GOOGLE AUTHENTICATION IS DISABLED!**"}
                This authentication can be used similarily to the local username/password authentication, also returning a refresh- and an access token.
                After the initial login via the ID token provided by the Google SDK, the regular authentication flow (renewing the access token via the refresh
                token when it expires) can be executed.
                An existing account with the Google ID or email address returned by Google's authentication service will be merged/updated - should no user
                with the provided info exist, a new one will be created automatically.`,
        tags: ["auth"],
        statusCodes: [
            errors.BAD_REQUEST_INVALID_AUTHENTICATION_PAYLOAD,
            errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS,
            errors.FORBIDDEN_GOOGLE_AUTHENTICATION_DISABLED,
            errors.FORBIDDEN_USER_DEACTIVATED
        ]
    })
    @REST.validate({
        payload: GoogleLoginRequest
    })
    @REST.response({
        schema: AuthResponse
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const payload: IAuthenticationPayloadGoogle = request.payload;

        const authenticationResult = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.google, payload);

        return {
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: authenticationResult.accessToken.token,
            refreshToken: authenticationResult.refreshToken.token
        };
    }
}

export default new AuthGoogleLogin();

import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import AuthenticationService, { AUTHENTICATION_TYPES, IAuthenticationPayloadFacebook } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { AuthResponse, FacebookLoginRequest } from "./_types";

@REST.controller("/api/v1")
class AuthFacebookLogin extends REST.SERVER.MethodController {
    @REST.post("/auth/facebook")
    @REST.noAuth
    @REST.documentation({
        description: `${CONFIG.auth.facebook.enabled ? "" : "[FACEBOOK AUTH DISABLED] "}Performs login using a Facebook (ID) token`,
        // tslint:disable:no-multiline-string
        notes: `${CONFIG.auth.facebook.enabled ? "" : "**FACEBOOK AUTHENTICATION IS DISABLED!**"}
                This authentication can be used similarily to the local username/password authentication, also returning a refresh- and an access token.
                After the initial login via the (ID) token provided by the Facebook SDK, the regular authentication flow (renewing the access token via the refresh
                token when it expires) can be executed.
                An existing account with the Facebook ID or email address returned by Facebook's authentication service will be merged/updated - should no user
                with the provided info exist, a new one will be created automatically.`,
        tags: ["auth"],
        statusCodes: [
            errors.BAD_REQUEST_INVALID_AUTHENTICATION_PAYLOAD,
            errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS,
            errors.FORBIDDEN_FACEBOOK_AUTHENTICATION_DISABLED,
            errors.FORBIDDEN_USER_DEACTIVATED
        ]
    })
    @REST.validate({
        payload: FacebookLoginRequest
    })
    @REST.response({
        schema: AuthResponse
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const payload: IAuthenticationPayloadFacebook = request.payload;

        const authenticationResult = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.facebook, payload);

        return {
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: authenticationResult.accessToken.token,
            refreshToken: authenticationResult.refreshToken.token
        };
    }
}

export default new AuthFacebookLogin();

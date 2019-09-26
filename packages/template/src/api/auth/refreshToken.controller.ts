import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import AuthenticationService, { AUTHENTICATION_TYPES, IAuthenticationPayloadRefreshToken } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { AuthResponse, RefreshTokenRequest } from "./_types";

@REST.controller("/api/v1")
class AuthRefreshToken extends REST.SERVER.MethodController {
    @REST.post("/auth/refresh")
    @REST.noAuth
    @REST.documentation({
        description: "Regenerates auth tokens using a refresh token",
        // tslint:disable:no-multiline-string
        notes: `Calling this endpoint generates a new access- and refresh token for a user, using an already existing refresh token.
                The existing refresh token is invalidated and has to be replaced by the newly generated one.`,
        tags: ["auth"],
        statusCodes: [
            errors.BAD_REQUEST_INVALID_AUTHENTICATION_PAYLOAD,
            errors.UNAUTHORIZED_INVALID_REFRESH_TOKEN,
            errors.FORBIDDEN_USER_DEACTIVATED
        ]
    })
    @REST.validate({
        payload: RefreshTokenRequest
    })
    @REST.response({
        schema: AuthResponse
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const payload: IAuthenticationPayloadRefreshToken = request.payload;

        const authenticationResult = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.refreshToken, payload);

        return {
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: authenticationResult.accessToken.token,
            refreshToken: authenticationResult.refreshToken.token
        };
    }
}

export default new AuthRefreshToken();

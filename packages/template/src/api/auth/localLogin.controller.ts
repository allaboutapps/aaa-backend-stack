import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import AuthenticationService, { AUTHENTICATION_TYPES, IAuthenticationPayloadLocal } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { AuthResponse, LocalLoginRequest } from "./_types";

@REST.controller("/api/v1")
class AuthLocalLogin extends REST.SERVER.MethodController {
    @REST.post("/auth/login")
    @REST.noAuth
    @REST.documentation({
        description: "Performs login using a locally created user account including username and password",
        // tslint:disable:no-multiline-string
        notes: `This authentication uses a locally created user account including username/password authentication, returning a refresh- and an access token.
                On the contrary to the Facebook and Google logins, no new user is created if no match was found for the provided username - use the
                \`POST /api/v1/auth/register\` endpoint to create a new local account.`,
        tags: ["auth"],
        statusCodes: [
            errors.BAD_REQUEST_INVALID_AUTHENTICATION_PAYLOAD,
            errors.UNAUTHORIZED_INVALID_LOGIN_CREDENTIALS,
            errors.FORBIDDEN_USER_DEACTIVATED
        ]
    })
    @REST.validate({
        payload: LocalLoginRequest
    })
    @REST.response({
        schema: AuthResponse
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const payload: IAuthenticationPayloadLocal = {
            username: request.payload.username,
            password: request.payload.password
        };

        const scopes: string[] = [];
        if (request.payload.scope) {
            scopes.push(request.payload.scope);
        }

        const authenticationResult = await AuthenticationService.authenticate(AUTHENTICATION_TYPES.local, payload, scopes);

        return {
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: authenticationResult.accessToken.token,
            refreshToken: authenticationResult.refreshToken.token
        };
    }
}

export default new AuthLocalLogin();

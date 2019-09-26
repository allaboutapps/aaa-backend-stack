import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import AuthenticationService from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { AuthResponse } from "./_types";

@REST.controller("/api/v1")
export class AuthGuestRegister extends REST.SERVER.MethodController {
    @REST.post("/auth/guest")
    @REST.noAuth
    @REST.documentation({
        description: `${CONFIG.auth.allowGuestAuth ? "" : "[GUEST AUTH DISABLED] "}Creates a new guest user and access token`,
        // tslint:disable:no-multiline-string
        notes: `${CONFIG.auth.allowGuestAuth ? "" : "**GUEST AUTHENTICATION IS DISABLED!**"}
            Creates a new guest user, providing reduced access to features without requiring a full registration.
            Guest users include no user information and will be granted a never expiring access token.
            Returns an error if guest authentication has been disabled.`,
        tags: ["auth"],
        statusCodes: [
            errors.FORBIDDEN_GUEST_AUTHENTICATION_DISABLED
        ]
    })
    @REST.response({
        schema: AuthResponse
    })
    @REST.detailedValidationErrors
    @REST.forwardBoomErrorPayloads
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const registrationResult = await AuthenticationService.createGuestUser();

        return {
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: registrationResult.accessToken.token,
            refreshToken: null as string
        };
    }
}

export default new AuthGuestRegister();

import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import AuthenticationService, { IRegistrationPayload } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { AuthResponse, RegisterRequest } from "./_types";

@REST.controller("/api/v1")
export class AuthRegister extends REST.SERVER.MethodController {
    @REST.post("/auth/register")
    @REST.noAuth
    @REST.documentation({
        description: "Registers a new local user with the provided username/password",
        // tslint:disable:no-multiline-string
        notes: `Creates a new user account in the local database using the provided username/password.
                No email verification is required.
                Returns auth tokens once registration has been completed successfully.`,
        tags: ["auth"],
        statusCodes: [
            errors.CONFLICT_USERNAME_EXISTS,
            errors.CONFLICT_WEAK_PASSWORD
        ]
    })
    @REST.validate({
        payload: RegisterRequest
    })
    @REST.response({
        schema: AuthResponse
    })
    @REST.detailedValidationErrors
    @REST.forwardBoomErrorPayloads
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const payload: IRegistrationPayload = request.payload;

        const registrationResult = await AuthenticationService.register(payload);

        return {
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: registrationResult.accessToken.token,
            refreshToken: registrationResult.refreshToken.token
        };
    }
}

export default new AuthRegister();

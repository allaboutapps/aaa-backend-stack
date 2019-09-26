import * as REST from "@aaa-backend-stack/rest";

import { AuthenticationService } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { InitiatePasswordResetRequest, InitiatePasswordResetResponse } from "./_types";

@REST.controller("/api/v1")
export class AuthInitiatePasswordReset extends REST.SERVER.MethodController {
    @REST.post("/auth/forgot-password")
    @REST.noAuth
    @REST.documentation({
        description: "Initiates a password reset for a local user, sending a reset link to the provided email address",
        // tslint:disable-next-line:no-multiline-string
        notes: `Endpoint also returns reponse indicating success for deactivated/unknown users to avoid user enumeration.
                Trying to reset the password for a non-local account results in an error being thrown.`,
        tags: ["auth"],
        statusCodes: [
            errors.FORBIDDEN_USER_NOT_LOCAL,
            errors.CONFLICT_EMAIL_FAILURE
        ]
    })
    @REST.validate({
        payload: InitiatePasswordResetRequest
    })
    @REST.response({
        schema: InitiatePasswordResetResponse
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        await AuthenticationService.initiatePasswordReset(request.payload.username);

        return {
            success: true
        };
    }
}

export default new AuthInitiatePasswordReset();

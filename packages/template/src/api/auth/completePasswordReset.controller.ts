import * as accepts from "accepts";

import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../../configure";
import { AuthenticationService, IPasswordResetPayload } from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { CompletePasswordResetRequest } from "./_types";

async function handleJSONResponse(payload: IPasswordResetPayload, reply: REST.HAPI.ReplyWithContinue) {
    try {
        const authenticationResult = await AuthenticationService.completePasswordReset(payload);

        reply({
            tokenType: "Bearer",
            expiresIn: CONFIG.auth.tokenValidity,
            accessToken: authenticationResult.accessToken.token,
            refreshToken: authenticationResult.refreshToken.token
        });
    } catch (err) {
        reply(err);
    }
}

async function handleHTMLResponse(payload: IPasswordResetPayload, reply: REST.HAPI.ReplyWithContinue) {
    try {
        await AuthenticationService.completePasswordReset(payload, false, reply);
    } catch (err) {
        reply.view("web/passwordReset.hbs", {
            token: payload.token,
            error: `Error: ${err.message}.`
        });
    }
}

@REST.controller("/api/v1")
export class AuthCompletePasswordReset extends REST.SERVER.MethodController {
    @REST.post("/auth/forgot-password/complete")
    @REST.noAuth
    @REST.documentation({
        description: "Completes the password reset process and sets the provided password",
        // tslint:disable-next-line:no-multiline-string
        notes: `Depending on the request's \`Accept\` header, the server either returns a HTML password reset form (for \`Accept: text/html\`)
                or a regular JSON response (for \`Accept: application/json\` or all other requests missing the \`text/html\` Accept header).
                On successful update, the JSON response contains an \`AuthResponse\` object including a newly generated access/refresh token
                (see \`POST /api/v1/auth/login\` for a schema).`,
        tags: ["auth"],
        statusCodes: [
            errors.BAD_REQUEST_INVALID_PASSWORD_RESET_PAYLOAD,
            errors.CONFLICT_PASSWORD_CONFIRMATION_MISMATCH,
            errors.CONFLICT_WEAK_PASSWORD,
            errors.FORBIDDEN_USER_DEACTIVATED
        ]
    })
    @REST.validate({
        payload: CompletePasswordResetRequest
    })
    @REST.forwardBoomErrorPayloads
    async handler(request: REST.HAPI.Request, reply: REST.HAPI.ReplyWithContinue) {
        const payload: IPasswordResetPayload = request.payload;
        const accept = accepts(request.raw.req);

        switch (accept.type("json", "html")) {
            case "json":
                await handleJSONResponse(payload, reply);
                break;
            case "html":
                await handleHTMLResponse(payload, reply);
                break;
            default:
                await handleJSONResponse(payload, reply);
        }
    }
}

export default new AuthCompletePasswordReset();

import * as REST from "@aaa-backend-stack/rest";
import { IInstances } from "@aaa-backend-stack/storage";

import CONFIG from "../../configure";
import AuthenticationService from "../../services/auth";
import * as errors from "../../services/auth/_errors";
import { LogoutRequest } from "./_types";

@REST.controller("/api/v1")
export class AuthLogout extends REST.SERVER.MethodController {
    @REST.post("/auth/logout")
    @REST.documentation({
        description: "Logs the user out",
        // tslint:disable:no-multiline-string
        notes: `Logs the user out, destroying the currently used access- as well as the provided refresh token.
            Note that logging out a guest user permanently removed their access to that guest account since they cannot regenerate a new token.`,
        tags: ["auth"],
        statusCodes: [
            errors.FORBIDDEN_INVALID_LOGOUT
        ]
    })
    @REST.authScope(CONFIG.auth.allowGuestAuth ? ["user", "guest"] : ["user"])
    @REST.validate({
        // RefreshToken can be provided via payload or query parameter
        payload: LogoutRequest.optional(),
        query: LogoutRequest.optional()
    })
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const user: IInstances.IUser = request.auth.credentials.user;
        const accessToken: IInstances.IAccessToken = request.auth.credentials.accessToken;

        await AuthenticationService.logout(user, accessToken, request.payload && request.payload.refreshToken ? request.payload.refreshToken : request.query.refreshToken);
    }
}

export default new AuthLogout();

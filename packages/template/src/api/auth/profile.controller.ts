import * as REST from "@aaa-backend-stack/rest";

import { AuthProfile } from "./_types";

@REST.controller("/api/v1")
export class Profile extends REST.SERVER.MethodController {
    @REST.get("/auth/profile")
    @REST.documentation({
        description: "Gets a generic auth-only-specific user-profile",
        tags: ["auth"]
    })
    @REST.response({
        schema: REST.JOI.object().required().keys({
            profile: AuthProfile.required()
        }).meta({
            className: "GetAuthProfileResponse"
        })
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const profile = await request.auth.credentials.user.getUserJsonObject();

        return {
            profile
        };
    }
}

export default new Profile();

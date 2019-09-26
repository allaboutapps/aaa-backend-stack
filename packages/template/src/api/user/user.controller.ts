import * as REST from "@aaa-backend-stack/rest";
import { IInstances } from "@aaa-backend-stack/storage";

import { AppUserProfile, AppUserProfilePatchRequest } from "./_types";

@REST.controller("/api/v1")
export class AppUser extends REST.SERVER.MethodController {

    @REST.get("/user/profile")
    @REST.authScope(["user", "guest"])
    @REST.documentation({
        description: "Gets a app-specific user-profile",
        tags: ["app"],
        statusCodes: [
            REST.BOOM.notFound
        ]
    })
    @REST.response({
        schema: AppUserProfile.required()
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async getProfile(request: REST.HAPI.Request) {
        const user: IInstances.IUser = request.auth.credentials.user;
        const appUserProfile = await user.getAppUserProfile();

        if (!appUserProfile) {
            throw REST.BOOM.notFound();
        }

        return appUserProfile.getAppUserProfileJsonObject();
    }

    @REST.patch("/user/profile")
    @REST.authScope(["user", "guest"])
    @REST.documentation({
        description: "Updates a app-specific user-profile",
        notes: "A full AppUserProfile instance can be send in the request, however, only the specified fields in AppUserProfilePatchRequest will be patched.",
        tags: ["app"],
        statusCodes: [
            REST.BOOM.notFound
        ]
    })
    @REST.response({
        schema: AppUserProfile.required()
    })
    @REST.validate({
        payload: AppUserProfilePatchRequest
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async patchProfile(request: REST.HAPI.Request) {
        const user: IInstances.IUser = request.auth.credentials.user;
        const appUserProfile = await user.getAppUserProfile();

        if (!appUserProfile) {
            throw REST.BOOM.notFound();
        }

        // TODO: patch...

        return appUserProfile.getAppUserProfileJsonObject();
    }

}

export default new AppUser();

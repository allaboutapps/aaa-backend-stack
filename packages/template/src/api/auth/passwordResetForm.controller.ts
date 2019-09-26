import * as REST from "@aaa-backend-stack/rest";

@REST.controller("/api/v1")
export class AuthPasswordResetForm extends REST.SERVER.MethodController {
    @REST.get("/auth/forgot-password/{token}")
    @REST.noAuth
    @REST.documentation({
        description: "Returns a HTML form to complete a previously initiated password reset",
        tags: ["auth"]
    })
    @REST.validate({
        params: REST.JOI.object().keys({
            token: REST.types.uidv4.required().description("Password reset token")
        }).required()
    })
    async handler(request: REST.HAPI.Request, reply: REST.HAPI.ReplyWithContinue) {
        reply.view("web/passwordReset.hbs", { token: request.params.token });

        return;
    }
}

export default new AuthPasswordResetForm();

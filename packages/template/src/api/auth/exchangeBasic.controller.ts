import * as REST from "@aaa-backend-stack/rest";

@REST.controller("/api/v1")
export class ExchangeBasic extends REST.SERVER.MethodController {

    @REST.get("/auth/exchange-basic")
    @REST.auth({
        strategies: ["basic-authentication"],
        scope: "cms"
    })
    @REST.documentation({
        description: "Allows to exchange basic auth credentials to an OAuth accesstoken (for graphQL debugging)",
        tags: ["auth"]
    })
    @REST.response({
        schema: REST.JOI.object().required().keys({
            Authorization: REST.JOI.string().required()
        })
    })
    @REST.forwardBoomErrorPayloads
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {
        const user = request.auth.credentials.user;

        const newAccessToken = await user.getNewAccessToken();

        return {
            Authorization: `Bearer ${newAccessToken.token}`
        };
    }

}

export default new ExchangeBasic();

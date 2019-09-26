import * as path from "path";

import * as REST from "@aaa-backend-stack/rest";

export default new REST.SERVER.StaticController([{
    method: "GET",
    path: "/assets/{param*}",
    handler: {
        directory: {
            path: path.join(__dirname, "../../../assets/")
        }
    },
    config: {
        auth: false,
        tags: ["api", "static"],
        description: "Non sensitive assets file serving",
        notes: "e.g. \"$app_content.css\"",
        ext: {
            onPreHandler: [{
                method: function (request: REST.HAPI.Request, reply: REST.HAPI.ReplyWithContinue) {
                    // rm trailing slashes in pathname
                    request.path = request.path.replace(/\/$/, "");
                    request.params.param = request.params.param.replace(/\/$/, "");

                    return reply.continue();
                }
            }]
        } as any
    }
}]);

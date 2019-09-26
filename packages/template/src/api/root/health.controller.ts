import * as REST from "@aaa-backend-stack/rest";
import storage, { Query } from "@aaa-backend-stack/storage";
import { checkFSTmpWriteable } from "@aaa-backend-stack/utils";

import CONFIG from "../../configure";

@REST.controller("/api/v1")
export class Health extends REST.SERVER.MethodController {

    @REST.get("/health")
    @REST.documentation({
        description: "Health information about the backend service",
        notes: "Either x-admin-secret header or query.pwd must be set",
        statusCodes: [
            REST.BOOM.badRequest,
            REST.BOOM.unauthorized
        ]
    })
    @REST.noAuth
    @REST.validate({
        headers: REST.JOI.object().unknown(true).keys({
            "x-admin-secret": REST.JOI.string().optional()
        }).optional(),
        query: {
            pwd: REST.JOI.string().optional()
        }
    })
    @REST.detailedValidationErrors
    @REST.autoReply
    async handler(request: REST.HAPI.Request) {

        if ((request.headers["x-admin-secret"] !== CONFIG.routes.monitoringAdminSecret)
            && (request.query.pwd !== CONFIG.routes.monitoringAdminSecret)) {
            throw REST.BOOM.unauthorized();
        }

        const [databaseWriteableCheck, fsWriteableCheck] = await Promise.all([
            storage.sequelize.query(Query.getSequenceNextValue("healthcheck_seq")),
            checkFSTmpWriteable()
            // ... additional checks that can be run in parallel...
        ]);

        return {
            databaseWriteableCheck: true,
            currentSequenceValue: databaseWriteableCheck[0][0].nextval,
            fsWriteableCheck
        };
    }

}

export default new Health();

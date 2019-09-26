import * as _ from "lodash";

import * as REST from "@aaa-backend-stack/rest";

const hook: REST.SERVER.IHook = {
    async init(api: REST.SERVER.Api) {
        api.server.ext("onPreResponse", (request: REST.HAPI.Request, reply: REST.HAPI.ReplyWithContinue) => {
            if (!request.response.isBoom) {
                return reply.continue();
            }

            const response: any = request.response;
            if (_.isNil(response.data)) {
                response.output.payload.errorType = "generic";
            } else {
                if (_.isString(response.data.errorType) && !_.isEmpty(response.data.errorType)) {
                    response.output.payload.errorType = response.data.errorType;
                } else {
                    response.output.payload.errorType = "generic";
                }
            }

            // If route onPreResponse handler is present, the `forwardBoomErrorPayloads` decorator has been used. Make sure we pass on additional error payload as well
            if (_.has(request, "route.settings.ext.onPreResponse")) {
                const additionalResponseDataKeys = _.without(_.keys(response.data), "errorType");
                if (!_.isEmpty(additionalResponseDataKeys)) {
                    if (_.isNil(response.output.payload.data)) {
                        response.output.payload.data = {};
                    }
                    _.each(additionalResponseDataKeys, (key) => {
                        response.output.payload.data[key] = response.data[key];
                    });
                }
            }

            return reply(response);
        });
    }
};

export default hook;

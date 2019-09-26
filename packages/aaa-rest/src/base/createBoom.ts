import * as Boom from "boom";
import { IStatusCodeDefinition } from "./IStatusCodeDefinition";
import * as _ from "lodash";

export function createBoom(statusCode: IStatusCodeDefinition, data?: any) {

    // Reformatting in accordance to https://github.com/hapijs/hapi/blob/master/API.md#error-transformation to include `errorCode`/`errorType` in output payloads
    const boomError = Boom.create(statusCode.code, statusCode.message, data || statusCode.errorType ? {
        ...(_.isObject(data) ? data : {}),
        ...(statusCode.errorType ? {
            errorType: statusCode.errorType
        } : {})
    } : undefined);
    boomError.output.statusCode = statusCode.code;
    boomError.reformat();

    if (statusCode.errorType) {
        boomError.output.payload.errorType = statusCode.errorType;
    }

    return boomError;
}

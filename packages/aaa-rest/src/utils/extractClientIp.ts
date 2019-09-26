import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/rest");

import { Request } from "hapi";

/**
 * Extract the final client ip address.
 * Can not use request.info.remoteAddress directly because client may be behind a proxy/loadbalancer
 * see https://github.com/hapijs/hapi/issues/1210
 * see https://github.com/creativelive/hapi-ratelimit/issues/24
 * @param request
 */
export function extractClientIp(request: Request) {
    // from http://stackoverflow.com/questions/29496257/knowing-request-ip-in-hapi-js-restful-api
    const xFF = request.headers["x-forwarded-for"];
    const ip = xFF ? xFF.split(",")[0] : request.info.remoteAddress;

    logger.debug({
        xFF,
        remoteAddress: request.info.remoteAddress,
        ip,
    }, "extractClientIp, will return extracted 'ip' from 'remoteAddress' and 'xFF'");

    return ip;
}

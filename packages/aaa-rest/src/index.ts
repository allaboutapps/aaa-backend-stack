// reexport 3rd party libraries under a namespace (implementation and typings! alltogether)
// see https://github.com/Microsoft/TypeScript/issues/4529 for more information
import * as BoomNamespace from "boom";
export { BoomNamespace as BOOM };

import * as JoiNamespace from "joi";
export { JoiNamespace as JOI };

import * as HapiNamespace from "hapi";
export { HapiNamespace as HAPI };

import * as MultipartyNamespace from "multiparty";
export { MultipartyNamespace as MULTIPARTY };

import * as HandlebarsNamespace from "handlebars";
export { HandlebarsNamespace as HANDLEBARS };

// export internal libraries
import * as baseNameSpace from "./base";
export { baseNameSpace as BASE };

import * as swaggerNamespace from "./swagger";
export { swaggerNamespace as SWAGGER };

import * as serverNameSpace from "./server";
export { serverNameSpace as SERVER };

import * as utilsNamespace from "./utils";
export { utilsNamespace as UTILS };

import * as types from "./types";
export { types };

import * as pluginsNamespace from "./plugins";
export { pluginsNamespace as PLUGINS };

import * as requestContext from "./requestContext";
export { requestContext as REQUEST_CONTEXT };

export { IApiOptions } from "./server/Api";

// all decorators are exported in the root namespace...
export {
    controller,
    config,
    get,
    all,
    cache,
    patch,
    post,
    pre,
    put,
    route,
    validate
} from "hapi-decorators";

export {
    ext,
    documentation,
    autoReply,
    response,
    auth,
    noAuth,
    authScope,
    deprecated,
    detailedValidationErrors,
    forwardBoomErrorPayloads,
    IHapiExtension,
    IHapiHandler,
    IHapiRouteExtConfiguration,
    del,
    statusCodes
} from "./decorators";

// export function __TESTS__() {
//     require("./tests");
// }

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/boom",
    "@types/hapi",
    "@types/hapi-decorators",
    "@types/joi",
    "@types/inert",
    "@types/multiparty",
    "@types/vision",
    "boom",
    "inert",
    "hapi",
    "hapi-auth-basic",
    "hapi-auth-bearer-token",
    "hapi-decorators",
    "hapi-swagger",
    "joi",
    "multiparty",
    "vision"
];

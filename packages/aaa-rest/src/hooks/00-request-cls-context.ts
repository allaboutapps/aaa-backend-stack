import { IApiOptions, IHook } from "../server/Api";
import { CLS_NAMESPACE, ICLSNamespace } from "@aaa-backend-stack/polyfills";
import { Request, ReplyWithContinue, ServerRequestExtPoints } from "hapi";

export interface IRequestCLSContextOptions {
    requestCLSContext: {
        enabled: boolean;

        // point of injection in hapi request lifecycle
        // https://github.com/hapijs/hapi/blob/master/API.md#request-lifecycle
        // defaults to onPreHandler, set to onRequest if it should ALWAYS run (performance-penality)
        spawnAtLifecycle?: ServerRequestExtPoints;

        // this function can be used to set additional fields on the cls context at the lifecycle point
        // e.g. parse additional args from the request to set extra CLS variables
        onNewRequestContext?: (request: Request, ns: ICLSNamespace) => any | Promise<any>;
    };
}

export const CLS_REQUEST_CONTEXT_IDENTIFIER = "request";

// automatically builds a CLS context around each request
// this allows to get the original request from anywhere in the call tree
export default class RequestCLSContextHook implements IHook {

    enabled: boolean = false; // defaults to false, see constructor
    spawnAtLifecycle: ServerRequestExtPoints = "onPreHandler";
    onNewRequestContext = function (request: Request, ns: ICLSNamespace) { return undefined; };

    constructor(apiOptions: IApiOptions) {
        if (apiOptions.baseHooks.requestCLSContext) {
            this.enabled = apiOptions.baseHooks.requestCLSContext.enabled;
            this.spawnAtLifecycle = apiOptions.baseHooks.requestCLSContext.spawnAtLifecycle || this.spawnAtLifecycle;
            this.onNewRequestContext = apiOptions.baseHooks.requestCLSContext.onNewRequestContext || this.onNewRequestContext;
        }
    }

    async init(api) {

        // attention, no fn scoping below (this context is managed by hapi, therefore shortcuts)
        const onNewRequestContext = this.onNewRequestContext;

        api.server.ext(this.spawnAtLifecycle, function (request: Request, reply: ReplyWithContinue) {

            // see https://github.com/othiym23/node-continuation-local-storage#namespacebindemitteremitter
            CLS_NAMESPACE.bindEmitter(request.raw.req);
            CLS_NAMESPACE.bindEmitter(request.raw.res);

            // we open a new CLS context
            // this vanishes automatically on request completion.
            return CLS_NAMESPACE.run(async function () {
                CLS_NAMESPACE.set(CLS_REQUEST_CONTEXT_IDENTIFIER, request);

                await onNewRequestContext(request, CLS_NAMESPACE);

                // console.log("onPreHandler", request.headers, request.payload);
                // @TODO: potential errors with sychronous error returns and CLS request wrapping were encountered, try to mitigate
                // see https://github.com/othiym23/node-continuation-local-storage/issues/119
                return reply.continue();
            });
        });

    }

}

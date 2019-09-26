// relies on hooks/request-cls-context to be enabled
import { Request } from "hapi";
import { CLS_NAMESPACE, IContext } from "@aaa-backend-stack/polyfills";
import { CLS_REQUEST_CONTEXT_IDENTIFIER } from "./hooks/00-request-cls-context";

// returns undefined if not within CLS_REQUEST_CONTEXT_IDENTIFIER current (outside of request)
export function getRequest(): Request | null {
    const request: Request = CLS_NAMESPACE.get(CLS_REQUEST_CONTEXT_IDENTIFIER);
    return request ? request : null;
}

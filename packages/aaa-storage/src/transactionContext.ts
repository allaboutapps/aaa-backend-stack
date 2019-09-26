// relies on hooks/request-cls-context to be enabled
import { CLS_NAMESPACE, IContext } from "@aaa-backend-stack/polyfills";
import { CLS_TRANSACTION_CONTEXT_IDENTIFIER, ICLSContextTransaction } from "./adapters/ConnectionAdapter";

// returns undefined if not within CLS_TRANSACTION_CONTEXT_IDENTIFIER current (outside of transaction)
export function getTransaction(): ICLSContextTransaction | null {
    const transaction: ICLSContextTransaction = CLS_NAMESPACE.get(CLS_TRANSACTION_CONTEXT_IDENTIFIER);
    return transaction ? transaction : null;
}

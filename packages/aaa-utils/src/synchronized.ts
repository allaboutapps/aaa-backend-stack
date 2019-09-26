import { getChildLogger } from "@aaa-backend-stack/logger";

// overloaded method to reuse the same fn signature while limiting execution for async functions only and keeping the return value
export function synchronized<T>(target: () => Promise<T>): () => Promise<T>;
export function synchronized<A1, T>(target: (arg1: A1) => Promise<T>): (arg1: A1) => Promise<T>;
export function synchronized<A1, A2, T>(target: (arg1: A1, arg2: A2) => Promise<T>): (arg1: A1, arg2: A2) => Promise<T>;
export function synchronized<A1, A2, A3, T>(target: (arg1: A1, arg2: A2, arg3: A3) => Promise<T>): (arg1: A1, arg2: A2, arg3: A3) => Promise<T>;
export function synchronized<A1, A2, A3, A4, T>(target: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>;
export function synchronized<A1, A2, A3, A4, A5, T>(target: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>;
export function synchronized<A, T>(target: (...args: A[]) => Promise<T>): (...args: A[]) => Promise<T> {

    const logger = getChildLogger("@aaa-backend-stack/utils");

    let mutexPromise: Promise<T> = null;

    return async (...params: A[]) => {
        let resolveMutexPromise: Function;
        let rejectMutexPromise: Function;

        if (!mutexPromise) {

            logger.trace({
                params
            }, "utils.synchronized: new mutex");

            mutexPromise = new Promise<T>((resolve, reject) => {
                resolveMutexPromise = resolve.bind(this);
                rejectMutexPromise = reject.bind(this);
            });

            try {
                const ret = await target(...params);

                logger.trace({
                    params,
                    ret
                }, "utils.synchronized: returning result");

                resolveMutexPromise(ret);
            } catch (err) {
                rejectMutexPromise(err);
            }
        } else {
            logger.trace({
                params
            }, "utils.synchronized: reusing mutex");
        }

        try {
            const value = await mutexPromise;
            mutexPromise = null;
            return value;
        } catch (error) {
            mutexPromise = null;
            throw error;
        }

    };
}

// same as above but allows to synchronize by an unique cacheKey
export function synchronizedBy<T>(target: () => Promise<T>): (cacheKey: string) => Promise<T>;
export function synchronizedBy<A1, T>(target: (arg1: A1) => Promise<T>): (cacheKey: string, arg1: A1) => Promise<T>;
export function synchronizedBy<A1, A2, T>(target: (arg1: A1, arg2: A2) => Promise<T>): (cacheKey: string, arg1: A1, arg2: A2) => Promise<T>;
export function synchronizedBy<A1, A2, A3, T>(target: (arg1: A1, arg2: A2, arg3: A3) => Promise<T>): (cacheKey: string, arg1: A1, arg2: A2, arg3: A3) => Promise<T>;
export function synchronizedBy<A1, A2, A3, A4, T>(target: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>): (cacheKey: string, arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>;
export function synchronizedBy<A1, A2, A3, A4, A5, T>(target: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>): (cacheKey: string, arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>;
export function synchronizedBy<A, T>(target: (...args: A[]) => Promise<T>): (cacheKey: string, ...args: A[]) => Promise<T> {

    const logger = getChildLogger("@aaa-backend-stack/utils");

    const mutexCache: { [cacheKey: string]: Promise<T> } = {};

    return async (cacheKey: string, ...params: A[]) => {
        let resolveMutexPromise: Function;
        let rejectMutexPromise: Function;

        if (!mutexCache[cacheKey]) {

            logger.trace({
                cacheKey,
                params
            }, "utils.synchronizedBy: new mutex");

            mutexCache[cacheKey] = new Promise<T>((resolve, reject) => {
                resolveMutexPromise = resolve.bind(this);
                rejectMutexPromise = reject.bind(this);
            });

            try {
                const ret = await target(...params);

                logger.trace({
                    cacheKey,
                    params,
                    ret
                }, "utils.synchronizedBy: returning result");

                resolveMutexPromise(ret);
            } catch (err) {
                rejectMutexPromise(err);
            }

        } else {
            logger.trace({
                cacheKey,
                params
            }, "utils.synchronizedBy: reusing mutex");
        }

        try {
            const value = await mutexCache[cacheKey];
            // rm from cache again
            delete mutexCache[cacheKey];
            return value;
        } catch (error) {
            // rm from cache again
            delete mutexCache[cacheKey];
            throw error;
        }
    };
}

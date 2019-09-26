type IAsyncHapiHandler = <T>(request: Request) => Promise<T>;

/**
 * Automatically wraps reply function over handler, allowing to work with async functions (await) directly
 * Instead of request, reply args - only the request arg is needed!
 */
export const autoReply: MethodDecorator = <MethodDecorator>function (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<IAsyncHapiHandler>) {

    // check for valid functions...    
    if (typeof descriptor.value !== "function") {
        console.error(target, key, descriptor);
        throw new SyntaxError("autoReply: Only functions can be marked as async hapi handlers");
    }

    // check for only a single argument is defined in the function
    // see https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Function/length
    if (descriptor.value.length !== 1) {
        console.error(target, key, descriptor);
        throw new SyntaxError("autoReply: Only async handler functions with a SINGLE (request: REST.IRequest) argument are allowed");
    }

    // TODO: eventually add runtime reflection here to ensure the function is defined as async and returning a promise!

    return {
        ...descriptor,
        value(...args) {
            const [request, reply] = args;
            return reply.apply(this, [
                // Attention: Note that Promise.delay(0) is essential here as we
                // want to push this down the V8 event loop so we can be sure any
                // synchronous thrown errors in the handler are properly wrapped
                // in the promise chain and not bubbled up to the globalUncaughtExceptionHandler
                // DO NOT CHANGE THIS, it really does not work with Promise.try or Promise.method!
                Promise.delay(0).then(function () {
                    return descriptor.value.apply(this, [
                        request
                    ]);
                })
            ]);
        }
    };
};

export default autoReply;

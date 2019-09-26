export default function logDeprecatedRouteHandler(handler, path, method) {
    return (...args) => {
        if (process.env.NODE_ENV !== "test") {
            console.warn(`${method} ${path}: ${handler.name} is deprecated and will be removed in the next api iteration.`);
        }
        return handler(...args);
    };
}

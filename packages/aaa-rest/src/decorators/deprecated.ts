import setRoute from "../internals/setRoute";
/**
 * Deprecates an route controller
 */
export const deprecated = function (target, key, descriptor) {

    setRoute(target, key, {
        config: {
            plugins: {
                "hapi-swagger": {
                    deprecated: true
                }
            }
        }
    });

    return descriptor;
};

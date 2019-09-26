import setRoute from "../internals/setRoute";

/**
 * Don't abort early while validating payload, params and response to joi schemas  
 */
export const detailedValidationErrors: MethodDecorator = function (target, key, descriptor) {

    setRoute(target, <string>key, {
        config: {
            validate: {
                options: {
                    abortEarly: false
                }
            }
        },
    });

    return descriptor;
};

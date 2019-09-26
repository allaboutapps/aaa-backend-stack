import setRoute from "../internals/setRoute";
import { boomErrorForwarder } from "../utils/boomErrorForwarder";

/**
 * Applies the boomErrorForwarder (also available in REST.utils.boomErrorForwarder) extension. Attention this overwrites any other existing extensions
 */
export const forwardBoomErrorPayloads: MethodDecorator = function (target, key, descriptor) {

    setRoute(target, <string>key, {
        config: {
            // TODO: don't overwrite already existing extensions
            ext: {
                onPreResponse: [boomErrorForwarder]
            }
        }
    } as any);

    return descriptor;
};

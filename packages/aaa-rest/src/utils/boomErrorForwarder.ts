/**
 * Allow forwarding of boom additional error data
 *
 * Usage:
 * @REST.ext({
 *     onPreResponse: [REST.utils.boomErrorForwarder]
 * })
 *
 * See:
 * - https://github.com/hapijs/boom/issues/49
 * - https://github.com/hapijs/boom/issues/126
 * - https://github.com/hapijs/boom#faq
 * - https://github.com/hapijs/hapi/issues/2566 (old impl.)
 * - https://github.com/agco/hapi-harvester/issues/12 (proper new impl. (array wrapped, object with a method property))
 * - https://github.com/hapijs/hapi/blob/d2735a516ffafebaca08d76cb26c8c3af2142b06/lib/schema.js#L83
 */
export const boomErrorForwarder = {
    method: function (request, reply) {
        const response: any = request.response;
        if (!response.isBoom || response.isServer === true) {
            return reply.continue();
        }

        // don't add additional error specifics for server internal errors
        // we are only allowed to pass this information for client related errors.
        if (response.data) {
            response.output.payload.data = response.data;
        }
        return reply(response);
    }
};

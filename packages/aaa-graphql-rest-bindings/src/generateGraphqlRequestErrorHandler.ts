import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/graphql-rest-bindings");

import * as _ from "lodash";
import { HAPI } from "@aaa-backend-stack/rest";
import { GQL, createError, formatApolloError, isApolloErrorInstance, GraphQLError, GraphQLSchema } from "@aaa-backend-stack/graphql";
import { graphqlHapi, IRegister } from "graphql-server-hapi";

// used in only production.
export const UNHANDLED_SERVER_ERROR: any = createError("UNHANDLED_SERVER_ERROR", {
    message: "The operations team has been notified."
});

export interface IGraphqlErrorHandlerOptions {
    includeServerStackTracesInClientErrors: boolean;
}

export function generateGraphqlRequestErrorHandler(request: any, options: IGraphqlErrorHandlerOptions): any {
    return function formatError(error: GraphQLError) {

        const { originalError } = error;

        // Log unknown errors as fatal errors!
        if (originalError instanceof GraphQLError === true // directly catch GraphQLErrors
            || isApolloErrorInstance(originalError) === true) { // apolloErrors

            // ok, known error
            logger.error({
                error,
                message: error.message,
                locations: error.locations,
                stack: error.stack,
                requestPayload: request ? request.payload : null
            }, "GraphQL defined serverside error");
        } else if (_.isUndefined(originalError) === true) {

            // directly catch clientside errors (those have no originalError set!)
            logger.error({
                error,
                message: error.message,
                locations: error.locations,
                stack: error.stack,
                requestPayload: request ? request.payload : null
            }, "GraphQL clientside error");
        } else {

            // fatal error!
            logger.fatal({
                error,
                message: error.message,
                locations: error.locations,
                stack: error.stack,
                requestPayload: request ? request.payload : null
            }, "GraphQL unhandled serverside fatal error");

            if (options.includeServerStackTracesInClientErrors === false) {
                // never show the stack to clients as it might contain sensitive information.
                // only enabled if the service is running in production mode.
                return formatApolloError(new UNHANDLED_SERVER_ERROR());
            }

        }

        // else format error through apollo-error and pass to the client... 
        return formatApolloError(error);
    };
}

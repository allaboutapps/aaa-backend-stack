import * as _ from "lodash";

export interface IGraphiQLPreresponseOptions {
    objectPathToRequestUserObject: string;
    getNewAccessTokenFn: (user: any) => Promise<{ token: string }>;
    browserGlobalTokenVariable: "__TOKEN";
}


export function injectAccessTokenIntoBrowserEnvironment(options: IGraphiQLPreresponseOptions) {
    return async function handlePreresponse(request: any, reply: any) {
        const { response } = request;
        const user: any = _.get(request, options.objectPathToRequestUserObject);

        // noop on errors
        if (response.isBoom || !response.source || !user) {
            return reply.continue();
        }

        // Non error, INJECT the accessToken from the authenticated user context directly into the <head> of the html response
        // this token can be reused for making queries to the protected graphql endpoint
        // we inject directly into the <head> to make sure this is called immediately on the browser side.
        const { token } = await options.getNewAccessTokenFn(user);

        return reply(response.source.replace("</head>", `
            <script>
                window.${options.browserGlobalTokenVariable} = "${token}";
                console.info("Hi!");
                console.info("A new AccessToken '${token}' was automatically injected into this debug session.");
                console.info('Feel free to set a different accessToken for another user anytime using:');
                console.info('window.${options.browserGlobalTokenVariable} = "MY_NEW_ACCESSTOKEN"');
            </script>
            </head>
        `));
    };
}


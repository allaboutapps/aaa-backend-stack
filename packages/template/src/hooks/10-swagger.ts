import * as REST from "@aaa-backend-stack/rest";

import CONFIG from "../configure";

// auth to the swagger endpoint will be disabled in the introspection and test env
const IS_INTROSPECTION_ENVIRONMENT = CONFIG.env === "introspect";

const hook: REST.SERVER.IHook = {
    enabled: CONFIG.enabledHooks.swagger,

    async init(api: REST.SERVER.Api) {

        if (api.apiOptions.baseHooks.inertStaticHandlers.enabled === false
            || api.apiOptions.baseHooks.visionHandlebarsTemplates.enabled === false) {

            throw new Error("swagger hook requires enabled api internalHooks inertStaticHandlers and visionHandlebarsTemplates");
        }

        await api.registerPlugin({
            register: REST.PLUGINS.getHapiSwaggerPlugin(),
            options: {
                // see https://github.com/glennjones/hapi-swagger/blob/master/usageguide.md#780-usage-guide
                documentationPage: true,
                pathPrefixSize: 3, // documentation routes grouping: how many path segments should be considered per group
                jsonPath: "/documentation/swagger.json", // important to be shilded from outside!
                auth: IS_INTROSPECTION_ENVIRONMENT ? false : {
                    strategy: "basic-authentication",
                    scope: "root"
                },
                jsonEditor: true,
                info: {
                    title: CONFIG.pkg.name,
                    version: CONFIG.pkg.version,
                    description: CONFIG.pkg.description
                },
                ...REST.SWAGGER.getSwaggerSecurityDefinitionObject({
                    includeBearerSecurityStrategyName: "default-authentication-strategy",
                    includeBasicAuthSecurityStrategyName: "basic-authentication"
                })
            }
        });
    }
};

export default hook;

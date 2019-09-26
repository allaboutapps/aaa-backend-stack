import { IApiOptions, IHook } from "../server/Api";

export interface IVisionTemplatesHookOptions {
    visionHandlebarsTemplates: {
        enabled: boolean;
        absolutePathToTemplates: string;
    };
}

export default class VisionTemplatesHook implements IHook {

    enabled: boolean = false;
    absolutePathToTemplates: string = null;

    constructor(apiOptions: IApiOptions) {
        if (apiOptions.baseHooks.visionHandlebarsTemplates) {
            this.enabled = apiOptions.baseHooks.visionHandlebarsTemplates.enabled;
            this.absolutePathToTemplates = apiOptions.baseHooks.visionHandlebarsTemplates.absolutePathToTemplates;
        }
    }

    async init(api) {

        // https://github.com/hapijs/vision
        // Static file and directory handlers
        // Attention, this is mandadory for swagger enabled apis!
        await api.registerPlugin({
            register: require("vision"),
            options: {}
        });

        // This is only needed if the server needs to render HTML from templates
        // Requires vision as provider injected through as a plugin.
        // Utilizes Handlebars as markup language.
        api.server.views({
            engines: {
                hbs: require("handlebars")
            },
            path: this.absolutePathToTemplates
        });

    }


}

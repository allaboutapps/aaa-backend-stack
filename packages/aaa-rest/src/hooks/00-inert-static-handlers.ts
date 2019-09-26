import { IApiOptions, IHook } from "../server/Api";

export interface IStaticHandlersHookOptions {
    inertStaticHandlers: {
        enabled: boolean;
    };
}

export default class StaticHandlersHook implements IHook {

    enabled: boolean = false;

    constructor(apiOptions: IApiOptions) {
        if (apiOptions.baseHooks.inertStaticHandlers) {
            this.enabled = apiOptions.baseHooks.inertStaticHandlers.enabled;
        }
    }

    async init(api) {

        // https://github.com/hapijs/inert
        // Static file and directory handlers
        // Attention, this is mandadory for swagger enabled apis!
        await api.registerPlugin({
            register: require("inert"),
            options: {}
        });

    }


}

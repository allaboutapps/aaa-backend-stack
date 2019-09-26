import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/rest");
import * as Hapi from "hapi";
import * as _ from "lodash";
import { REQUIRE_DIR } from "@aaa-backend-stack/build-tools";
import * as path from "path";

import { HookLifeCycle, IHookLifeCycleOptions, IGenericHook, IHookMap } from "@aaa-backend-stack/utils";

import { IStaticHandlersHookOptions } from "../hooks/00-inert-static-handlers";
import { IVisionTemplatesHookOptions } from "../hooks/00-vision-templates-rendering";
import { IRequestCLSContextOptions } from "../hooks/00-request-cls-context";

export interface IApiOptions extends IHookLifeCycleOptions {
    absolutePathToHooksDirectory: string;
    host: string;
    port: string | number;
    cors: boolean;
    enableHapiDebugLogs: boolean;
    baseHooks?: Partial<IStaticHandlersHookOptions>
    & Partial<IVisionTemplatesHookOptions>
    & Partial<IRequestCLSContextOptions>;
    hapiServerOptions?: Hapi.ServerOptions;
}

// a typical api-server hook
export interface IHook extends IGenericHook {
    enabled?: boolean; // defaults to true, controls if the hook will be executed at all 
    init(api: Api): Promise<any | void>;
    destroy?(api: Api): Promise<any | void>;
    reinitialize?(api: Api): Promise<any | void>;
    getInfo?(api: Api): object;
}

export class Api extends HookLifeCycle {
    private static _instance: Api;

    private _ready: Promise<boolean>;
    private _server: Hapi.Server;
    private _registerHapiServerPlugins: Function;
    private _startHapiServer: Function;
    private _stopHapiServer: Function;
    private _apiOptions: IApiOptions;

    static get instance() {
        return Api._instance;
    }

    static getServerInfo(): object {
        return Api.instance.getInstanceInfo.bind(Api.instance)();
    }

    getInstanceInfo(): object {
        return this.getHooksPublicInfo();
    }

    get server() {
        return this._server;
    }

    get ready() {
        return this._ready;
    }

    get apiOptions() {
        return this._apiOptions;
    }

    constructor(apiOptions: IApiOptions) {

        super(apiOptions);

        // Singleton API
        if (Api._instance) {
            throw new Error("The Api class is a singleton and only allowed to be instanciated once per process.");
        }

        logger.info("Initializing Server...");

        this._apiOptions = {
            ...apiOptions,
            // ensure baseHooks property exists
            ...(apiOptions.baseHooks ? {} : {
                baseHooks: {}
            })
        };

        Api._instance = this;

        logger.debug({
            apiOptions
        }, "Assembled apiOptions");

        try {

            // Create a new Hapi server
            this._server = new Hapi.Server({
                connections: {
                    routes: {
                        cors: apiOptions.cors
                    }
                },
                debug: {
                    log: apiOptions.enableHapiDebugLogs ? ["error"] : [],
                    request: apiOptions.enableHapiDebugLogs ? ["error"] : []
                },
                // allow to overwrite the above config if a custom hapiServerOptions was supplied
                ...(apiOptions.hapiServerOptions ? apiOptions.hapiServerOptions : {})
            });

            // Promisifiy all needed hapi server callback methods, with the newly created hapi server instance as context
            this._registerHapiServerPlugins = Promise.promisify(this._server.register, { context: this._server });
            this._startHapiServer = Promise.promisify(this._server.start, { context: this._server });
            this._stopHapiServer = Promise.promisify(this._server.stop, { context: this._server });

            // Set server port
            this._server.connection({
                host: apiOptions.host, // host needs to be set in any case, else tests will not run through!
                port: apiOptions.port
            });

            this._ready = (async () => {

                // Require all hooks, group them, then sort them through "xx-" to process their initialization order.
                const allHooks: IHookMap = {
                    ...REQUIRE_DIR(path.resolve(__dirname, "../hooks")), // internal defined hooks
                    ...REQUIRE_DIR(apiOptions.absolutePathToHooksDirectory)
                };

                await this.initHooks(allHooks);
                return true;

            })();

        } catch (err) {
            logger.fatal("Error while starting up server", err);
            throw err; // throw the fatal error
        }

    }

    getConnectionInfo(): Hapi.ServerConnectionInfo {
        return this.server.info;
    }

    async registerPlugin(hapiPluginDefinition: Hapi.PluginRegistrationObject<any>): Promise<void | any> {
        logger.trace({
            hapiPluginDefinition
        }, `api.registerPlugin`);
        return this._registerHapiServerPlugins(hapiPluginDefinition);
    }

    async registerPlugins(hapiPluginDefinitions: Hapi.PluginRegistrationObject<any>[]): Promise<void | any> {
        logger.trace({
            hapiPluginDefinitions
        }, `api.registerPlugins`);
        return this._registerHapiServerPlugins(hapiPluginDefinitions);
    }

    async shutdownServer(): Promise<void> {
        logger.warn("Shutting down server ...");

        await Promise.all([
            this._stopHapiServer({
                timeout: 5 * 1000
            }),
            this.killHooks()
        ]);

        logger.info("Successfully shut down server.");
        process.exit(0);
    }

    async startServer(): Promise<Api> {
        logger.debug("Starting Api server...");
        await this._startHapiServer();
        logger.info("Server running at: " + this._server.info.uri);
        logger.info(Api.getServerInfo(), "Server Info");

        // tslint:disable-next-line:no-floating-promises
        process.on("SIGINT", () => { this.shutdownServer(); });

        // tslint:disable-next-line:no-floating-promises
        process.on("SIGTERM", () => { this.shutdownServer(); });

        return this; // return the full Api service instance to be able to chain...
    }

}

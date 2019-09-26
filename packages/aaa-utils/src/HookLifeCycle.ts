import { getChildLogger, ILogger } from "@aaa-backend-stack/logger";
import * as _ from "lodash";

export interface IHookLifeCycleOptions { }

export interface IGenericHook {
    enabled?: boolean; // defaults to true, controls if the hook will be executed at all 
    init(lifeCycle: HookLifeCycle): Promise<any | void>;
    destroy?(lifeCycle: HookLifeCycle): Promise<any | void>;
    reinitialize?(lifeCycle: HookLifeCycle): Promise<any | void>;
    getInfo?(lifeCycle: HookLifeCycle): object;
}

export type IGenericHookConstructor = new (lifeCycleOptions: IHookLifeCycleOptions) => IGenericHook;

// interface for hooks required through REQUIRE_DIR --> e.g. { "00-my-hook": { default: hook } }
export interface IHookMap {
    [key: string]: {
        default: IGenericHook | IGenericHookConstructor;
    };
}

interface IInternalHookMap {
    [key: string]: {
        default: IGenericHook; // IGenericHookConstructor was constructed.
    };
}

export class HookLifeCycle {

    private _lifeCycleOptions: IHookLifeCycleOptions;
    private _hooksMap: IInternalHookMap;
    private _hooksInitialized: boolean = false;
    private _logger = getChildLogger("@aaa-backend-stack/utils");

    constructor(lifeCycleOptions: IHookLifeCycleOptions) {
        this._lifeCycleOptions = lifeCycleOptions;
    }

    public async initHooks(allHooks: IHookMap) {

        if (this._hooksInitialized === true) {
            throw new Error("HookLifeCycle.initHooks: We are already initialized");
        }

        this._logger.debug("HookLifeCycle.initHooks");

        // get all defined hooks in the pass directory...
        this.processAndSetHooks(allHooks);

        // now initialize the hooks (grouped by their XX-* identifier)
        const groupedHooks = this.getGroupedHooks();
        await this.initializeHooks(groupedHooks);
    }

    public async resetHooks() {

        if (this._hooksInitialized === false) {
            throw new Error("HookLifeCycle.resetHooks: We are not initialized");
        }

        this._logger.debug("HookLifeCycle.resetHooks");

        const groupedHooks = this.getGroupedHooks();

        await this.destroyHooks(groupedHooks);
        await this.reinitializeHooks(groupedHooks);
    }

    public async killHooks() {

        if (this._hooksInitialized === false) {
            throw new Error("HookLifeCycle.resetHooks: We are not initialized");
        }

        this._logger.debug("HookLifeCycle.killHooks");

        const groupedHooks = this.getGroupedHooks();

        await this.destroyHooks(groupedHooks);
    }

    public getHooksPublicInfo() {

        if (this._hooksInitialized === false) {
            throw new Error("HookLifeCycle.getHooksPublicInfo: We are not initialized!");
        }

        // get all public info objects from the hooks...
        return _.reduce(_.keys(this._hooksMap), (sum, hook) => {

            if (this._hooksMap[hook].default.getInfo) {
                return {
                    ...sum,
                    ...(this._hooksMap[hook].default.getInfo(this))
                };
            }

            return sum;

        }, {});
    }

    private processAndSetHooks(allHooks: IHookMap) {
        this._logger.trace("Attempting to require all hooks...");

        const constructedHooks: IInternalHookMap = _.reduce(allHooks, (sum, requiredHook, key) => {

            if (_.isFunction(requiredHook.default)) {

                // Class Constructor function received, hook must be constructed through new...
                const HookClass: IGenericHookConstructor = <IGenericHookConstructor>requiredHook.default;

                this._logger.trace({ key, requiredHook }, "Received hook Class Constructor, constructing...");

                return {
                    ...sum,
                    [key]: {
                        default: new HookClass(this._lifeCycleOptions)
                    }
                };
            }

            return {
                ...sum,
                [key]: requiredHook
            };

        }, {});

        const enabledHooks: IInternalHookMap = _.reduce(constructedHooks, (sum, requiredHook, key) => {

            if (_.isObject(requiredHook.default) === false || _.isFunction(requiredHook.default.init) === false) {
                this._logger.warn({ key, requiredHook }, "skipping hook as non object or init function is missing");
                return sum;
            }

            if (requiredHook.default.enabled === false) {
                this._logger.debug({ key, requiredHook }, "disabled hook as enabled===false");
                return sum;
            }

            return {
                ...sum,
                [key]: requiredHook
            };

        }, {});

        // side effect: save to private hooksMap fields!
        this._hooksMap = enabledHooks;
    }

    private getGroupedHooks() {
        // now initialize the hooks (grouped by their XX-* identifier)
        return _.groupBy(_.keys(this._hooksMap), (entry) => {
            return entry.split("-")[0];
        });
    }

    private async initializeHooks(groupedHooks) {
        await Promise.each(_.keys(groupedHooks).sort(), (groupId: string) => {

            this._logger.trace({
                groupId,
                hooks: groupedHooks[groupId]
            }, `Initializing hook group...`);

            return Promise.all(_.map(groupedHooks[groupId], async (hookId: string) => {
                // initialize the hook...
                this._logger.debug({
                    groupId
                }, `Initializing hook ${hookId}...`);
                await this._hooksMap[hookId].default.init(this);

                this._logger.trace({
                    groupId
                }, `Initialized hook ${hookId}.`);

            }));
        });

        this._logger.debug({
            groupedHooks
        }, "Initialized all hooks.");

        this._hooksInitialized = true;
    }

    private async destroyHooks(groupedHooks) {
        await Promise.each(_.keys(groupedHooks).sort().reverse(), (groupId: string) => {

            this._logger.trace({
                groupId,
                hooks: groupedHooks[groupId]
            }, `Destroying hook group...`);

            return Promise.all(_.map(groupedHooks[groupId], async (hookId: string) => {

                if (_.isFunction(this._hooksMap[hookId].default.destroy) === false) {
                    this._logger.trace({
                        groupId
                    }, `Skipping destroy of hook ${hookId}.`);
                    return; // noop
                }

                this._logger.debug({
                    groupId
                }, `Destroying hook ${hookId}...`);

                // destroy the hook...
                await this._hooksMap[hookId].default.destroy(this);

                this._logger.trace({
                    groupId
                }, `Destroyed hook ${hookId}.`);
            }));
        });

        this._logger.debug({
            groupedHooks
        }, "Destroyed all hooks.");

        this._hooksInitialized = false;
    }

    private async reinitializeHooks(groupedHooks) {
        await Promise.each(_.keys(groupedHooks).sort(), (groupId: string) => {

            this._logger.trace({
                groupId,
                hooks: groupedHooks[groupId]
            }, `Reinitialize hook group...`);

            return Promise.all(_.map(groupedHooks[groupId], async (hookId: string) => {

                if (_.isFunction(this._hooksMap[hookId].default.reinitialize) === false) {
                    this._logger.trace({
                        groupId
                    }, `Skipping reinitialization of hook ${hookId}.`);
                    return; // noop
                }

                this._logger.debug({
                    groupId
                }, `Reinitializing hook ${hookId}...`);

                // reinitialize the hook...
                await this._hooksMap[hookId].default.reinitialize(this);

                this._logger.trace({
                    groupId
                }, `Reinitialized hook ${hookId}.`);

            }));
        });

        this._logger.debug({
            groupedHooks
        }, "Reinitialized all hooks.");

        this._hooksInitialized = true;
    }

}

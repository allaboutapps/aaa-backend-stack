import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import * as Sequelize from "sequelize";
import { ModelAdapter, IModelAdapterConfig } from "./ModelAdapter";

export interface IStorageAdapterConfig extends IModelAdapterConfig {
    rlsRole?: string; // Optional role to use for Row Level Security enhanced transactions
}

export class StorageAdapter<TModels extends object> extends ModelAdapter<TModels, IStorageAdapterConfig> {

    protected _resolveIsInitialized: Function;
    protected _isInitialized: Promise<boolean>;

    constructor() {
        super();
        // no auto-initialization takes place, use StorageAdapter.initialize() to do so.
        this._isInitialized = new Promise<boolean>((resolve, reject) => {
            this._resolveIsInitialized = resolve.bind(this, true);
        });
    }

    public isInitialized(): Promise<boolean> {
        // will resolve to true if storage was initialized once!
        // see this.initialize()
        return this._isInitialized;
    }

    public async initialize(options: IStorageAdapterConfig, autoResolveIsInitialized: boolean = true): Promise<IStorageAdapterConfig> {
        if (_.isEmpty(options.rlsRole)) {
            options.rlsRole = null;
        }

        this.setConfig(options);

        logger.debug({
            models: _.keys(options.modelDefinitions),
            modelMigrationsDirectory: options.modelMigrationsDirectory
        }, "initalizing StorageAdapter");

        await this.initConnectionAdapter();
        this.initMigrationAdapter(options.modelMigrationsDirectory, null);
        this.initModelAdapter();

        // we are configured now, typically you will want to resolve here (not true if storage is managed by a TstStrategy as we are still awaiting for the first slave initialization!)
        if (autoResolveIsInitialized) {
            this._resolveIsInitialized();
        }

        return options;
    }

    public async reinitialize(customInitializedSequelizeInstance: Sequelize.Sequelize = null, customInitializedModels: any = null, options = {
        newSequelize: true,
        newUmzug: true,
        newModels: true,
    }, customInitializedUmzug = null) {

        logger.warn({
            options,
            customInitializedSequelizeInstanceIsSet: _.isNull(customInitializedSequelizeInstance),
            customInitializedModelsAreSet: _.isNull(customInitializedSequelizeInstance)
        }, "reinitializing StorageAdapter");

        if (options.newSequelize) {
            await this.initConnectionAdapter(customInitializedSequelizeInstance);
        }

        if (options.newUmzug) {
            this.initMigrationAdapter(this.CONFIG.modelMigrationsDirectory, customInitializedUmzug);
        }

        if (options.newModels) {
            this.initModelAdapter(customInitializedModels);
        }

        // we might be handled by a TestStrategy - if this is the case, we are resolved now as the storage is reinitialized with the first slave database
        this._resolveIsInitialized();
    }

    public disconnect(): void {
        this.destroyConnectionAdapter();
        this.destroyMigrationAdapter();
        this.destroyModelAdapter();
    }

}

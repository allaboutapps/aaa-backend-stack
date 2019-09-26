import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Umzug from "umzug";
import storage, { IStorageStrategyConfig } from "./index";
import { IPGConnectionOptions } from "./adapters/ConnectionAdapter";
import { sqlAsync } from "./sqlAsync";

export default class SlaveDB {

    readonly id: number;
    readonly databaseName: string = null;

    private _initializedInMS: number = 0;
    private _readyWaitTimeMS: number = 0;

    private _initialized: boolean = false;
    private _dirty: boolean = false;
    private _closed: boolean = false;
    private _destroyed: boolean = false;
    private _ready: Promise<boolean> = Promise.resolve(false);

    private _creationDate: Date;
    private _initOptions: IStorageStrategyConfig;

    // managed items
    private _sequelizeInstance: Sequelize.Sequelize = null;
    private _umzugInstance = null;
    private _models = null;

    constructor(id: number, initOpts: IStorageStrategyConfig) {

        // tslint:disable-next-line:aaa-no-new-date
        this._creationDate = new Date();

        this._initOptions = initOpts;

        const {
            database,
            username,
            password,
            ...restPGConfig
        } = initOpts.pgConnection;

        this.id = id;
        this.databaseName = database + "_" + _.padStart(id + "", initOpts.padSlaveIdentifiersLength || 3, "0");

        // Commands to create a new database (with the above padded extra identifier) from an already hydrated template database (with fixtures)
        // Requires the connecting user to be allowed to drop and create databases --> dbo
        const DROP = `DROP DATABASE IF EXISTS "${this.databaseName}";`;
        const CREATE = `CREATE DATABASE "${this.databaseName}" WITH OWNER ${username} TEMPLATE "${database}";`;

        logger.debug({
            id,
            DROP,
            CREATE
        }, "SlaveDB constructor ");

        this._ready = sqlAsync([
            // Silence NOTICE warnings, see https://stackoverflow.com/questions/27588613/reduce-bothering-notices-in-plpgsql
            `SET client_min_messages=warning;`,
            DROP,
            CREATE
        ], initOpts.pgConnection).then(() => {

            this.initialize();
            // tslint:disable-next-line:aaa-no-new-date
            this._initializedInMS = new Date().getTime() - this._creationDate.getTime();
            this._initialized = true;

            logger.trace({
                id,
                _creationDate: this._creationDate,
                _initializedInMS: this._initializedInMS
            }, "SlaveDB initialized");

            return true;
        });
    }

    get pgConnectionOptions(): IPGConnectionOptions {
        return {
            ...this._initOptions.pgConnection,
            database: this.databaseName,
        };
    }

    get dirty(): boolean {
        return this._dirty;
    }

    get readyWaitTimeMS(): number {
        return this._readyWaitTimeMS;
    }

    get initializedInMS(): number {
        return this._initializedInMS;
    }

    get ready(): Promise<boolean> {
        return this._ready;
    }

    get initialized(): boolean {
        return this._initialized;
    }

    get closed(): boolean {
        return this._closed;
    }

    flagDirty(): SlaveDB {
        if (this._dirty === true) {
            throw new Error("You cannot reuse a _dirty SlaveDB: " + this.databaseName);
        }

        this._dirty = true;
        return this;
    }

    close(): void {
        if (this._initialized === true && this._closed === false) {
            this._sequelizeInstance.close();
            this._umzugInstance = null;
            this._sequelizeInstance = null;
            this._models = null;
            this._closed = true;
        }
    }

    reopen(): void {
        if (this._initialized === true && this._closed === true) {
            this.initialize();
            this._closed = false;
        }
    }

    destroy(): void {

        if (this._closed === false || this.initialized === false) {
            throw new Error(`SlaceDB.destroy: Database ${this.databaseName} must be closed=true and initialized=true to be allowed to be destroyed`);
        }

        if (this._destroyed !== true) {
            this._destroyed = true;
            // tslint:disable-next-line:no-floating-promises
            sqlAsync([`DROP DATABASE IF EXISTS "${this.databaseName}";`], this._initOptions.pgConnection).then(() => {
                logger.trace({
                    id: this.id,
                }, "SlaveDB destroyed");
            }).catch((e) => {
                // silent warning
                logger.warn({
                    err: e,
                    id: this.id,
                }, "Failed to destroy SlaveDB");
            });
        }
    }

    getManagedItems() {
        if (this._closed === true) {
            throw new Error(`SlaveDB.getSequelizeInstance: ${this.databaseName} is already _closed! use .reopen() if you still need to use it.`);
        }

        if (this._initialized === false) {
            throw new Error(`SlaveDB.getSequelizeInstance: ${this.databaseName} was never initialized!`);
        }

        return {
            sequelizeInstance: this._sequelizeInstance,
            umzugInstance: this._umzugInstance,
            models: this._models
        };
    }

    async getReadyInstance(): Promise<SlaveDB> {
        if (this._initialized === false) {
            // capture wait time!
            // tslint:disable-next-line:aaa-no-new-date
            const startedToWaitForReadyDate: Date = new Date();

            // not initialized yet, wait for ready signal...
            await this._ready;

            // tslint:disable-next-line:aaa-no-new-date
            this._readyWaitTimeMS = new Date().getTime() - startedToWaitForReadyDate.getTime();
            return this;
        }

        this._readyWaitTimeMS = 0; // no wait time

        if (this._dirty === false) {
            // not _dirty, immediate return possible
            return Promise.resolve(this);
        }

        return Promise.reject(new Error("An already _dirty SlaveDB cannot be reused."));
    }

    private initialize() {

        const {
            database,
            username,
            password,
            ...restPGConfig
        } = this._initOptions.pgConnection;

        this._sequelizeInstance = new Sequelize(this.databaseName, username, password, _.defaults({
            logging: (query) => {
                logger.trace(query);
            }
        }, {
                ...restPGConfig,
                dialect: "postgres",
                native: true,
            }));

        this._umzugInstance = new Umzug({
            storage: "sequelize",
            storageOptions: {
                sequelize: this._sequelizeInstance
            },
            migrations: {
                path: this._initOptions.modelMigrationsDirectory,
                pattern: /^\d+[\w-]+\.js$/,
                params: [
                    this._sequelizeInstance.getQueryInterface(),
                    Sequelize
                ]
            }
        });

        this._models = storage.processModels(this._sequelizeInstance);
    }

}

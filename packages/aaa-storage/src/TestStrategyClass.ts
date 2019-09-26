import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import { IStorageAdapterConfig, StorageAdapter } from "./adapters/StorageAdapter";
import { execAsync } from "@aaa-backend-stack/utils";
import { sqlAsync } from "./sqlAsync";
import * as _ from "lodash";
import {
    IPGConnectionOptions
} from "./adapters/ConnectionAdapter";
import {
    IBulkData,
    IFixtureTrees
} from "./adapters/ModelAdapter";
import PGTemplatePool from "./PGTemplatePool";
import SlaveDB from "./SlaveDB";
import { FS_EXTRA } from "@aaa-backend-stack/build-tools";
import { IMochaThisContext } from "@aaa-backend-stack/test-environment";
import * as bluebirdRetry from "bluebird-retry";
import * as crypto from "crypto";
import * as path from "path";

// use this hash tag in the title of a test to skip a full database reset (only used if the test passes) - don't use this if your test makes modifications to the database!
const SKIP_HARD_STORAGE_RESET_HASH_TAG = "#noreset";

// use this hash tag to define bundles of tests (place it on a describe), database will only be resetted after all tests (if tests have errors, this does not apply!)
const SKIP_HARD_STORAGE_RESET_WITHIN_DESCRIBE_SUITE_HASH_TAG = "#resetafter";

export const CONNECTION_RETRY_CONFIG = {
    interval: 1000,
    max_interval: 5000,
    timeout: 60000,
    max_tries: 18,
    backoff: 2 // factor
};

export interface IStorageStrategyConfig extends IStorageAdapterConfig {
    prebufferCount?: number; // amount of isolated postgres database to keep prebuffered - defaults to 8
    bulkData?: IBulkData;
    fixtureTrees?: IFixtureTrees;
    afterImportFn?: (storage: StorageAdapter<any>) => Promise<void>;
    fastDropAndCreate?: boolean; // DEPRECATED - will be true by default in the future, initially drop tables by replacing with default pg template, defaults to true
    padSlaveIdentifiersLength?: number; // defaults to 3 e.g. "database_00x", should be increased if you have more then 1000 tests
    useMigrationIntermediateDBCache?: boolean; // defaults to true (use cache), will check for md5 equality of migration files (does not apply to fixtures)
    connectionRetryConfig?: typeof CONNECTION_RETRY_CONFIG; // allows to specify a different connection retry config if needed.
    destroySlaveDBsOnSwitch?: boolean; // optional, destroy slave db if it's no longer used. Defaults to true if process.env.CI is set
}

export class TestStrategy {
    private templatePool: PGTemplatePool = null;
    private storage: StorageAdapter<any>;

    // performance related variables (for report generation and test title sugaring)
    private warmupMSMap = {
        drop: 0,
        migrate: 0,
        import: 0,
        special: 0,
        pool: 0,
        total: 0
    };

    private switchMSMap = {
        disconnect: [],
        slave: [],
        reinitialize: [],
        total: []
    };

    private isInfoAlreadyRead = false;

    constructor(storage: StorageAdapter<any>) {
        this.storage = storage;
    }

    public async init(opts: IStorageStrategyConfig): Promise<void> {

        // set default values for initOpts
        const initOpts: IStorageStrategyConfig = {
            ...opts,
            destroySlaveDBsOnSwitch: _.isBoolean(opts.destroySlaveDBsOnSwitch)
                ? opts.destroySlaveDBsOnSwitch
                : process.env.CI
                    ? true
                    : false
        };

        const useFastDropAndCreate = initOpts.fastDropAndCreate !== false;
        const useIntermediateMigrationsCache = initOpts.useMigrationIntermediateDBCache !== false;

        logger.trace("TestStrategy: initializeTestStrategy, warming up...");

        const getMarkedMS = initializeMSMarker();

        let allowedToSkipMigrations = false; // if we are using intermediate caching, we might we allowed to skip...
        const intermediateDatabase = initOpts.pgConnection.database + "_intermediate"; // not always used.
        let currentMigrationHashes;

        if (useIntermediateMigrationsCache === true && useFastDropAndCreate === false) {
            throw new Error("Using fastDropAndCreate=false is only supported with useMigrationIntermediateDBCache=false.");
        }

        await bluebirdRetry(async () => {

            try {

                if (useFastDropAndCreate === false) {
                    console.log("[DEPRECATED]: fastDropAndCreate=false is deprecated and will default to true in upcoming releases.");
                    // initialize first then drop through storage interface
                    await this.storage.initialize(initOpts, false);
                    await this.storage.dropAllTables();
                    return; // bailout!
                }

                if (useIntermediateMigrationsCache === false) {
                    // speedy get a fresh new template database (will be populated with (cached) migrations and new fixutres) by using fastDropAndCreate
                    await fastDropAndCreate(initOpts.pgConnection);
                    await this.storage.initialize(initOpts, false);
                    return; // bailout!
                }

                // try to connect to migration intermediate database if it exists
                // check if hashes and file count (exact name) still match with our current migration files
                // if this is the case, we are allowed to skip the migrate handler down there
                // instead use this intermediate database as the base to scaffold the new template database (without fixtures)
                const [cmh, intermediateDatabaseExists] = await Promise.all([
                    getMigrationsFileMD5s(initOpts.modelMigrationsDirectory),
                    await checkDatabaseExists(intermediateDatabase, initOpts.pgConnection),
                ]);

                currentMigrationHashes = cmh; // side effect push to outer scope

                if (intermediateDatabaseExists === false) {
                    console.log(`Creating intermediate migration cache "${intermediateDatabase}"...`);

                    await sqlAsync([
                        // Silence NOTICE warnings, see https://stackoverflow.com/questions/27588613/reduce-bothering-notices-in-plpgsql
                        `SET client_min_messages=warning;`,
                        `CREATE DATABASE "${intermediateDatabase}" WITH OWNER ${initOpts.pgConnection.username} TEMPLATE "template0";`
                    ], initOpts.pgConnection);
                }

                // if migration caching is activated, we create an additional table in the intermediate template-database
                // so we can track the hashes of the inserted migrations...
                const [noticeStatement, createStatementRes, currentCachePlain] = await sqlAsync([
                    // Silence NOTICE warnings, see https://stackoverflow.com/questions/27588613/reduce-bothering-notices-in-plpgsql
                    `SET client_min_messages=warning;`,
                    `CREATE TABLE IF NOT EXISTS test_strategy_intermediate(id CHAR(100) PRIMARY KEY NOT NULL, json JSONB NOT NULL);`,
                    `SELECT * FROM test_strategy_intermediate WHERE id = 'migration_cache';`
                ], initOpts.pgConnection, intermediateDatabase);


                const currentCache = currentCachePlain && currentCachePlain.length === 1 ? currentCachePlain[0] : null;

                // console.log("cache from db:", currentCache, currentCachePlain, currentCachePlain.length);
                // check if the cache is valid, if this so, allow to skip migrations...
                if (currentCache && currentCache.json) {

                    if (_.isEqual(currentCache.json, currentMigrationHashes)) {
                        // console.log(`Intermediate migration cache "${intermediateDatabase}" is valid, skipping migrations...`);
                        allowedToSkipMigrations = true;
                    }
                }

                // cache invalid? force full rebuild of intermediate template database by wipe!
                if (allowedToSkipMigrations === false) {
                    console.log(`Intermediate migration cache "${intermediateDatabase}" is outdated, reinitializing...`);
                    // clear the database and resetup test_strategy_intermediate table.
                    await fastDropAndCreate({ ...initOpts.pgConnection, database: intermediateDatabase });
                    await sqlAsync([
                        // Silence NOTICE warnings, see https://stackoverflow.com/questions/27588613/reduce-bothering-notices-in-plpgsql
                        `SET client_min_messages=warning;`,
                        `CREATE TABLE IF NOT EXISTS test_strategy_intermediate(id CHAR(100) PRIMARY KEY NOT NULL, json JSONB NOT NULL);`
                    ], initOpts.pgConnection, intermediateDatabase);
                }

                return;

            } catch (e) {
                console.error(`Failed to connect to database, ${e} - retrying...`);
                throw e;
            }

        }, { ...(initOpts.connectionRetryConfig ? initOpts.connectionRetryConfig : CONNECTION_RETRY_CONFIG), context: this });

        this.warmupMSMap.drop = getMarkedMS();

        if (allowedToSkipMigrations === false) {

            if (useIntermediateMigrationsCache === true) {
                // overwrite main config so we operate on the intermediate database now...
                await this.storage.initialize({
                    ...initOpts,
                    pgConnection: {
                        ...initOpts.pgConnection,
                        database: intermediateDatabase
                    }
                } as IStorageStrategyConfig, false);
            }

            await this.storage.migrateUp(true, false).catch((e) => {
                logger.fatal({
                    error: e
                }, "TestStrategy: Encountered fatal error while migrating up!");
                throw e;
            });
        }

        if (useIntermediateMigrationsCache === true) {

            if (allowedToSkipMigrations === false) {
                // we just migrated up while we are using an intermediate cache
                // insert the new values we are allowed to cache...
                // console.log("insert migration cache hashes...", JSON.stringify(currentMigrationHashes));
                await this.storage.sequelize.query(`
                    DELETE FROM test_strategy_intermediate WHERE id = 'migration_cache';
                    INSERT INTO test_strategy_intermediate(id, json) VALUES('migration_cache', '${JSON.stringify(currentMigrationHashes)}');
                `, { plain: true, raw: true });

                // now it's time to close, create and switch storage...
                this.storage.disconnect();
            }

            await fastDropAndCreate(initOpts.pgConnection, intermediateDatabase);
            await this.storage.initialize(initOpts, false);
            // clear the intermediate table from the real template database
            await this.storage.sequelize.query(`DROP TABLE test_strategy_intermediate;`, { plain: true, raw: true });
        }

        this.warmupMSMap.migrate = getMarkedMS();

        if (initOpts.bulkData && _.keys(initOpts.bulkData).length > 0) {
            await this.storage.bulkImport(initOpts.bulkData);
        }

        if (initOpts.fixtureTrees && initOpts.fixtureTrees.length > 0) {
            await this.storage.treeImport(initOpts.fixtureTrees);
        }
        this.warmupMSMap.import = getMarkedMS();

        if (initOpts.afterImportFn) {
            await initOpts.afterImportFn(this.storage);
        }
        this.warmupMSMap.special = getMarkedMS();

        this.templatePool = new PGTemplatePool(initOpts);

        this.warmupMSMap.pool = getMarkedMS();
        this.warmupMSMap.total = getMarkedMS(true);

        logger.trace("TestStrategy: initializeTestStrategy, warmup done");

        // continue with attaching the first created salve database to the storage
        return await this.switchToNewSlaveDB();
    }

    public async switchToNewSlaveDB(): Promise<void> {

        const getMarkedMS = initializeMSMarker();

        this.storage.disconnect();
        this.switchMSMap.disconnect.push(getMarkedMS());

        const newSlave = await this.templatePool.getNextSlaveDBName();

        this.switchMSMap.slave.push(getMarkedMS());

        const { sequelizeInstance, models, umzugInstance } = newSlave.getManagedItems();

        await this.storage.reinitialize(sequelizeInstance, models, {
            newModels: true,
            newSequelize: true,
            newUmzug: true
        }, umzugInstance);
        this.switchMSMap.reinitialize.push(getMarkedMS());

        this.isInfoAlreadyRead = false;
        this.switchMSMap.total.push(getMarkedMS(true));

        return; // void.
    }

    public printStrategyReport(): void {

        const INITIALIZED_ITEM_CREATION_TIMES = _.map(_.filter(this.templatePool.slaves, { initialized: true }), (item) => {
            return item.initializedInMS;
        });

        const WAITED_FOR_ITEM_TO_BECOME_READY_TIMES = _.map(_.filter(this.templatePool.slaves, { initialized: true, dirty: true }), (item) => {
            return item.readyWaitTimeMS;
        });

        const ITEM_CREATION_MS_SUM = _.reduce(INITIALIZED_ITEM_CREATION_TIMES, (sum, time) => (sum + time), 0);
        const ITEM_CREATION_MS_MIN = _.min(INITIALIZED_ITEM_CREATION_TIMES);
        const ITEM_CREATION_MS_MAX = _.max(INITIALIZED_ITEM_CREATION_TIMES);

        const SWITCH_TOTAL_MS_SUM = _.reduce(this.switchMSMap.total, (sum, time) => (sum + time), 0);
        const SWITCH_TOTAL_MS_MIN = _.min(this.switchMSMap.total);
        const SWITCH_TOTAL_MS_MAX = _.max(this.switchMSMap.total);

        const SWITCH_DISCONNECT_SUM = _.reduce(this.switchMSMap.disconnect, (sum, time) => (sum + time), 0);
        const SWITCH_SLAVE_SUM = _.reduce(this.switchMSMap.slave, (sum, time) => (sum + time), 0);
        const SWITCH_REINITIALIZE_SUM = _.reduce(this.switchMSMap.reinitialize, (sum, time) => (sum + time), 0);

        const WAIT_COUNT = _.reduce(WAITED_FOR_ITEM_TO_BECOME_READY_TIMES, (sum, time) => {
            return time > 0 ? sum + 1 : sum;
        }, 0);
        const WAIT_MS_SUM = _.reduce(WAITED_FOR_ITEM_TO_BECOME_READY_TIMES, (sum, time) => (sum + time), 0);
        const WAIT_MS_MAX = _.max(WAITED_FOR_ITEM_TO_BECOME_READY_TIMES);

        const TOTAL_SYNC_ISOLATION_TIME = this.warmupMSMap.total + SWITCH_TOTAL_MS_SUM;
        const TOTAL_EXECUTED_TIME = process.uptime() * 1000;

        console.info(`--- -----------------<storageHelper strategy report>------------------ ---
    slaves switched:               ${intent(this.switchMSMap.total.length)} avg=${Math.floor(SWITCH_TOTAL_MS_SUM / this.switchMSMap.total.length)}ms min=${SWITCH_TOTAL_MS_MIN}ms max=${SWITCH_TOTAL_MS_MAX}ms
    slaves awaited:                ${intent(WAIT_COUNT)} prebuffer=${this.templatePool.prebufferCount} avg=${Math.floor(WAIT_MS_SUM / WAIT_COUNT)}ms max=${WAIT_MS_MAX}ms
    background slaves:             ${intent(this.templatePool.slaves.length)} avg=${Math.floor(ITEM_CREATION_MS_SUM / this.templatePool.slaves.length)}ms min=${ITEM_CREATION_MS_MIN}ms max=${ITEM_CREATION_MS_MAX}ms
    - warm up:                     ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * this.warmupMSMap.total)} ${this.warmupMSMap.total}ms 
        * drop/cache check:        ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * this.warmupMSMap.drop)} ${this.warmupMSMap.drop}ms 
        * migrate/cache reuse:     ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * this.warmupMSMap.migrate)} ${this.warmupMSMap.migrate}ms 
        * fixtures:                ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * this.warmupMSMap.import)} ${this.warmupMSMap.import}ms
        * special:                 ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * this.warmupMSMap.special)} ${this.warmupMSMap.special}ms
        * create pool:             ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * this.warmupMSMap.pool)} ${this.warmupMSMap.pool}ms
    - switching:                   ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * SWITCH_TOTAL_MS_SUM)} ${SWITCH_TOTAL_MS_SUM}ms
        * disconnect:              ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * SWITCH_DISCONNECT_SUM)} ${SWITCH_DISCONNECT_SUM}ms
        * switch slave:            ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * SWITCH_SLAVE_SUM)} ${SWITCH_SLAVE_SUM}ms
            - resolve next:        ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * (SWITCH_SLAVE_SUM - WAIT_MS_SUM))} ${(SWITCH_SLAVE_SUM - WAIT_MS_SUM)}ms
            - await next:          ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * WAIT_MS_SUM)} ${WAIT_MS_SUM}ms
        * reinitialize:            ${percent(1 / TOTAL_SYNC_ISOLATION_TIME * SWITCH_REINITIALIZE_SUM)} ${SWITCH_REINITIALIZE_SUM}ms
    strategy related time:         ${intent("")} ${TOTAL_SYNC_ISOLATION_TIME}ms 
    vs total executed time:        ${percent(1 / TOTAL_EXECUTED_TIME * TOTAL_SYNC_ISOLATION_TIME)} ${Math.floor(TOTAL_EXECUTED_TIME)}ms
--- ----------------</ storageHelper strategy report>----------------- ---`);

    }

    public disconnectSlave() {
        logger.debug("TestStrategy.disconnect: disconnecting the storage...");
        this.storage.disconnect(); // close the storage...

        logger.debug("TestStrategy.disconnect: closing the SlaveDB...");
        this.templatePool.getCurrentSlave().close(); // and the slave owning the sequelize instance!
    }

    public async reconnectSlave() {
        logger.debug("TestStrategy.reconnect: reopening SlaveDB...");
        this.templatePool.getCurrentSlave().reopen();

        logger.debug("TestStrategy.reconnect: reinitializing the storage...");

        const { sequelizeInstance, umzugInstance, models } = this.templatePool.getCurrentSlave().getManagedItems();
        await this.storage.reinitialize(sequelizeInstance, models, { newModels: true, newUmzug: true, newSequelize: true }, umzugInstance);
    }

    public getCurrentSlave() {
        return this.templatePool.getCurrentSlave();
    }

    public async importFromSQLDump(absolutePathToFile: string, migrateAfterImport: boolean = true) {

        const {
            password,
            username,
        } = this.templatePool.initOptions.pgConnection;

        // disconnect from the current slave...
        this.disconnectSlave();

        // TODO: replace this shell exeCommand with a direct sql connection through pg-native!
        // NOPE: this does not work, there is no "FROM stdin;" in node pg
        const exeCommand = `sh -c "PGPASSWORD=${password} psql --file ${absolutePathToFile} -U ${username} -d ${this.templatePool.getCurrentSlaveDBName()}"`;
        logger.debug({ exeCommand }, "TestStrategy.importFromSQLDump...");

        const [stdout, stderr] = await execAsync(exeCommand);

        if (stderr.length > 0) {
            logger.fatal({
                error: stderr,
                absolutePathToFile
            }, "TestStrategy.importFromSQLDump: FATAL ERROR encountered with importFromSQLDump");
            throw new Error("importFromSQLDump failed e=" + stderr);
        }

        // reopen the slave which will hold the sequelize instance...
        await this.reconnectSlave();

        // try to migrate (if imported model is old and wanted)...
        if (migrateAfterImport) {
            logger.debug("TestStrategy.importFromSQLDump: migrating up with imported dump...");
            return await this.storage.migrateUp(true, false);
        }
    }

    public mochaIsAllowedToSkipHardStorageReset(mochaContext: IMochaThisContext) {
        if (mochaContext.currentTest.state !== "passed") {
            // console.log("reset (error encountered)");
            return false;
        }

        // if the test signals that it has not caused modifications to the database, we can safely ignore
        // migrating the databse once again.
        if (mochaContext.currentTest.title.indexOf(SKIP_HARD_STORAGE_RESET_HASH_TAG) !== -1) {
            // console.log("skip reset");
            return true;
        }

        // if the suite is tagged,
        if (mochaContext.currentTest.parent.title.indexOf(SKIP_HARD_STORAGE_RESET_WITHIN_DESCRIBE_SUITE_HASH_TAG) !== -1 &&
            _.filter(mochaContext.currentTest.parent.tests, function (test: any) {
                return _.isUndefined(test.state);
            }).length > 0) {
            // console.log("skip reset (suite)");
            return true;
        }

        return false;
    }

    // attention, will deliver ('reused') of called multiple times
    public getCurrentSlavePrintDecoration(): string {

        if (this.isInfoAlreadyRead) {
            return `@${this.templatePool.getCurrentSlaveDBName()} (reused)`;
        }

        this.isInfoAlreadyRead = true; // flag
        // return `@${this.templatePool.getCurrentSlaveDBName()} (${Math.floor(_.last(this.switchMSMap.total))}ms)`;
        return `@${this.templatePool.getCurrentSlaveDBName()}`; // no x ms output
    }

    public mochaAttachCurrentStorageSlaveInformation(mochaContext: IMochaThisContext) {
        // for easier debugging only, append the title of the used db schema for this test before printing to the console.
        mochaContext.currentTest.title += ` ${this.getCurrentSlavePrintDecoration()}`;
    }

}

// private non stateful helpers...
function initializeMSMarker(): (fromBeginning?: boolean) => number {

    // tslint:disable-next-line:aaa-no-new-date
    let warmupStartDate: Date = new Date();
    let lastMark: Date = warmupStartDate;

    return (fromBeginning: boolean = false) => {

        if (fromBeginning) {
            // tslint:disable-next-line:aaa-no-new-date
            return new Date().getTime() - warmupStartDate.getTime();
        }

        // tslint:disable-next-line:aaa-no-new-date
        const offset: number = new Date().getTime() - lastMark.getTime();

        // sideeffect updates lastMark 
        // tslint:disable-next-line:aaa-no-new-date
        lastMark = new Date();

        return offset;
    };
}

function intent(value: any): string {
    return _.padEnd(value, 6, " ");
}
function percent(value: number): string {
    return intent(Math.floor(value * 100) + "%");
}

export async function fastDropAndCreate(opts: IPGConnectionOptions, pgTemplateDB = "template0") {
    const { database, username, password } = opts;

    const DROP = `DROP DATABASE IF EXISTS "${database}";`;
    const CREATE = `CREATE DATABASE "${database}" WITH OWNER ${username} TEMPLATE "${pgTemplateDB}";`;

    logger.trace({
        DROP,
        CREATE
    }, "fastDropAndCreate");

    const res = await sqlAsync([
        // Silence NOTICE warnings, see https://stackoverflow.com/questions/27588613/reduce-bothering-notices-in-plpgsql
        `SET client_min_messages=warning;`,
        DROP,
        CREATE
    ], opts);

    logger.trace({
        res,
        DROP,
        CREATE
    }, "fastDropAndCreate executed");
}

export async function getMigrationsFileMD5s(modelMigrationsDirectory: string) {
    const potentialMigrationFiles = await FS_EXTRA.readdir(modelMigrationsDirectory);

    const hashes = _.compact(await Promise.map(potentialMigrationFiles, async (id) => {

        const ext = path.extname(id);
        const absolutePath = path.join(modelMigrationsDirectory, id);

        // assert that each file with an .js extension is a migration file.
        if (ext !== ".js") {
            return false;
        }

        const migBuf = await FS_EXTRA.readFile(absolutePath);
        const md5 = crypto.createHash("md5").update(migBuf).digest("hex");

        return {
            id,
            md5
        };

    }));

    return hashes;
}

export async function checkDatabaseExists(database: string, opts: IPGConnectionOptions, pgTemplateDB = "template0") {
    const [existsRows] = await sqlAsync([`SELECT 1 as exists FROM pg_database WHERE datname = '${database}'`], opts);

    // console.log(JSON.stringify(existsRows));
    return existsRows.length === 1 && existsRows[0].exists === 1;
}

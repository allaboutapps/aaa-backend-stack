import { getChildLogger } from "@aaa-backend-stack/logger";
import { CLS_NAMESPACE, usingClsHooked } from "@aaa-backend-stack/polyfills";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import * as Sequelize from "sequelize";
import dataloader, { resetCache as dataloaderResetCache } from "dataloader-sequelize";
import * as bluebirdRetry from "bluebird-retry";
import * as os from "os";
const pg = require("pg").native;

// Settings
pg.defaults.parseInt8 = true; // TODO: This setting casts BIGINT types to JS numbers with a potential overflow. Maybe replace with own datatype parser that errors out on overflow?

export interface IPGConnectionOptions {
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
    timezone: string;
    pool?: Partial<IPGConnectionPoolOptions>;
}

export interface IPGConnectionPoolOptions {
    max: number;
    min: number;
    idle: number;
    handleDisconnects: boolean;
}

const PG_CONNECTION_SEQ_POOL_DEFAULTS = {
    max: process.env.SEQ_POOL_MAX
        ? parseInt(process.env.SEQ_POOL_MAX, 10)
        : os.cpus().length * 2, // cpu_cores * 2 is the default max for database connections
    min: process.env.SEQ_POOL_MIN
        ? parseInt(process.env.SEQ_POOL_MIN, 10)
        : 1, // we try to keep at least one connection open all time
    idle: process.env.SEQ_POOL_IDLE
        ? parseInt(process.env.SEQ_POOL_IDLE, 10)
        : 60000,
    handleDisconnects: true
};

export interface IConnectionAdapterConfig {
    pgConnection: IPGConnectionOptions;
}

export type IAutoCallback = (t: Sequelize.Transaction) => Promise<any>;
export type ICLSContextTransaction = Sequelize.Transaction & { id: string };

export const CLS_TRANSACTION_CONTEXT_IDENTIFIER = "transaction";

const DEFAULT_PARAMETERS_NAMESPACE = "my";
const CONNECTION_RETRY_CONFIG = {
    interval: 1000,
    max_interval: 5000,
    timeout: 30000,
    max_tries: 8,
    backoff: 2 // factor
};
export interface IExtendedTransactionOptions extends Sequelize.TransactionOptions {

    // allows to set a specific postgresql db-role during a transaction
    // e.g. a role level access policy one via SET LOCAL ROLE <role>
    // see https://www.postgresql.org/docs/9.0/static/sql-set-role.html
    role?: string;

    // the namespace the new custom parameters localParameters will live in
    // defaults to "my" (DEFAULT_LOCAL_PARAMETERS_NAMESPACE)
    // see https://blog.2ndquadrant.com/application-users-vs-row-level-security/
    parametersNamespace?: string;

    // local transaction configuration_parameters to set (all parameters in the object will be set)
    // e.g. SET LOCAL <my.localParameters.<key>> = 'value' | value | DEFAULT
    // see https://www.postgresql.org/docs/9.0/static/sql-set.html
    parameters?: object;

    // global postgres parameters (all parameters in the object will be set)
    // e.g. SET LOCAL <pgParameters.<key>> = 'value' | value | DEFAULT
    // see https://www.postgresql.org/docs/9.2/static/config-setting.html
    pgParameters?: object;
}

export class ConnectionAdapter<TConfig extends IConnectionAdapterConfig> {

    protected _sequelize: Sequelize.Sequelize = null;
    protected _CONFIG: TConfig;

    // sets the config, must be done before initialize is called.
    protected setConfig(config: TConfig) {

        if (this._sequelize && this._CONFIG) {
            logger.fatal("ConnectionAdapter: tried to reset config while sequelize is still initialized.");
            throw new Error("ConnectionAdapter: tried to reset config while sequelize is still initialized.");
        }

        this._CONFIG = _.defaultsDeep(config, {
            pgConnection: {
                pool: {
                    ...PG_CONNECTION_SEQ_POOL_DEFAULTS,
                    ...(config.pgConnection.pool ? config.pgConnection.pool : {})
                }
            }
        });
    }

    public get CONFIG(): TConfig {

        if (!this._CONFIG) {
            logger.fatal("ConnectionAdapter has no CONFIG yet");
            throw new Error("ConnectionAdapter has no CONFIG yet");
        }

        return this._CONFIG;
    }

    public get sequelize(): Sequelize.Sequelize {
        if (!this._sequelize) {
            logger.fatal("tried to get sequelize from disconnected ConnectionAdapter");
            throw new Error("cannot get sequelize from a disconnected ConnectionAdapter");
        }

        return this._sequelize;
    }

    /**
     * Spawns a new transaction or reuses an existing one from the Promise CLS context and executes all queries within the transaction.
     * 
     * The transaction is automatically committed/rolled back at the end of the `autoCallback` function - returning a result/`void` triggers a
     * `COMMIT`, throwing an error a `ROLLBACK`.
     * 
     * Sequelize automatically adds the transaction to the CLS context during the `autoCallback` function, thus automatically executing all queries within inside the transaction.
     *
     * @param {IAutoCallback} autoCallback Autocallback function executed within transaction, receives `Transaction` object as only parameter
     * @returns {Promise<any>} Promise resolving with value returned within `autoCallback` function
     * @memberof ConnectionAdapter
     */
    public async transaction(autoCallback: IAutoCallback): Promise<any>;
    /**
     * Spawns a new transaction or reuses an existing one from the Promise CLS context and executes all queries within the transaction.
     * 
     * Allows for additional transaction options to be provided, including a role and (local) Postgres parameters to use during the transaction (e.g. for row level security).
     * 
     * The transaction is automatically committed/rolled back at the end of the `autoCallback` function - returning a result/`void` triggers a
     * `COMMIT`, throwing an error a `ROLLBACK`.
     * 
     * Sequelize automatically adds the transaction to the CLS context during the `autoCallback` function, thus automatically executing all queries within inside the transaction.
     *
     * @param {IExtendedTransactionOptions} options Options to apply to transaction and query execution
     * @param {IAutoCallback} autoCallback Autocallback function executed within transaction, receives `Transaction` object as only parameter
     * @returns {Promise<any>} Promise resolving with value returned within `autoCallback` function
     * @memberof ConnectionAdapter
     */
    public async transaction(options: IExtendedTransactionOptions, autoCallback: IAutoCallback): Promise<any>;
    /**
     * Spawns a new transaction or reuses an existing one from the Promise CLS context and returns the transaction (after applying optional transaction-specific queries).
     * 
     * Allows for (optional) additional transaction options to be provided, including a role and (local) Postgres parameters to use during the transaction (e.g. for row level security).
     * 
     * **ATTENTION**: The transaction is **NOT** automatically committed/rolled back - you **MUST** call `await transaction.commit()` or `await transaction.rollback()` yourself,
     * otherwise the transaction will be kept open indefinitely.
     * 
     * **ATTENTION**: Sequelize **DOES NOT** automatically add the transaction to the CLS context for your current call stack, you **MUST** do so automatically (or pass the transaction
     * to each sequelize query manually), otherwise your queries following the transaction will **NOT** be executed inside the transaction.
     *
     * @param {IExtendedTransactionOptions} [options] Optional options to apply to transaction and query execution
     * @returns {Promise<Sequelize.Transaction>} Promise resolving with transaction to use with sequelize
     * @memberof ConnectionAdapter
     */
    public async transaction(options?: IExtendedTransactionOptions): Promise<Sequelize.Transaction>;
    public async transaction(...args): Promise<any> {

        const self = this;

        // see overload behaviour...
        let autoCallback: IAutoCallback = null;
        let options: IExtendedTransactionOptions = null;
        if (args.length === 2) {
            autoCallback = args[1];
            options = args[0];
        } else if (args.length === 1) {
            if (_.isFunction(args[0])) {
                autoCallback = args[0];
            } else {
                options = args[0];
            }
        }

        const transactionFromContext: ICLSContextTransaction = Sequelize.cls.get(CLS_TRANSACTION_CONTEXT_IDENTIFIER);

        if (transactionFromContext) {
            logger.trace(`ConnectionAdapter.transaction: reusing transaction '${transactionFromContext.id}' from CLS context`);
            return _.isNil(autoCallback) ? transactionFromContext : autoCallback(transactionFromContext);
        }

        logger.trace({
            options
        }, "ConnectionAdapter.transaction: spawing a new transaction");

        if (!options) {
            // no options received, either return transaction (if no autoCallback provided) or call transaction with autoCallback as first parameter
            return _.isNil(autoCallback) ? this.sequelize.transaction() : this.sequelize.transaction(autoCallback as any);
        }

        // autoCallback must be decorated if options.role or options.parameters is supplied.
        // preProcessCallback --> midProcessCallback --> postProcessCallback --> autoCallback
        //    pgParameters    -->         role       -->      parameters     --> autoCallback

        // Return transaction/result properly, depending on autoCallback
        const txReturn = _.isNil(autoCallback) ? function (tx: Sequelize.Transaction) { return tx; } : autoCallback;

        // sets local postgresql parameters for the transaction
        const parametersNamespace = options.parametersNamespace || DEFAULT_PARAMETERS_NAMESPACE;
        const postProcessCallback = !options.parameters ? txReturn : async function (tx: Sequelize.Transaction) {
            // all local parameters are set...
            await Promise.each(_.keys(options.parameters), function (key) {
                const val = options.parameters[key];
                const escapedVal = self.sequelize.escape(val);
                const escapedNamespacedKey = (`${parametersNamespace}.${key}`).split(" ").join("");

                const query = `SET LOCAL ${escapedNamespacedKey} = ${escapedVal}`;

                logger.trace({
                    key,
                    val,
                    escapedVal,
                    escapedNamespacedKey,
                    query
                }, "ConnectionAdapter.transaction: Setting local (custom) parameter...");

                return self._sequelize.query(query, { transaction: tx });
            });
            return txReturn(tx);
        };

        // sets the role for the transaction.
        const midProcessCallback = !options.role ? postProcessCallback : async function (tx: Sequelize.Transaction) {

            const query = `SET LOCAL ROLE ${self.sequelize.escape(options.role)}`;

            logger.trace({
                role: options.role,
                query
            }, "ConnectionAdapter.transaction: Setting local role...");

            await self._sequelize.query(query, { transaction: tx });
            return postProcessCallback(tx);
        };

        // set global postgresql parameters to use for the transaction
        const preProcessCallback = !options.pgParameters ? midProcessCallback : async function (tx: Sequelize.Transaction) {
            // all global parameters are set...
            await Promise.each(_.keys(options.pgParameters), function (key) {
                const val = options.pgParameters[key];
                const escapedVal = self.sequelize.escape(val);
                const escapedKey = key.split(" ").join("");

                const query = `SET LOCAL ${escapedKey} = ${escapedVal}`;

                logger.trace({
                    key,
                    val,
                    escapedKey,
                    escapedVal,
                    query
                }, "ConnectionAdapter.transaction: Setting local (pg) parameter...");

                return self._sequelize.query(query, { transaction: tx });
            });
            return midProcessCallback(tx);
        };

        if (_.isNil(autoCallback)) {
            // Sequelize typings are incomplete - sequelize.transaction can be called with options parameter only for unmanaged transactions
            // Transaction is returned instead of auto-committed, see https://sequelize.readthedocs.io/en/v3/docs/transactions/
            const tx: Sequelize.Transaction = await (<any>this.sequelize).transaction(options);

            return preProcessCallback(tx);
        } else {
            return this.sequelize.transaction(options, preProcessCallback as any);
        }
    }

    /**
     * Tries to retrieve an existing Sequelize transaction from the current CLS context
     *
     * @returns {(Sequelize.Transaction | null)} Existing Sequelize transaction or `null` if not available
     * @memberof ConnectionAdapter
     */
    public getTransaction(): Sequelize.Transaction | null {
        const existingTransaction: Sequelize.Transaction = CLS_NAMESPACE.get(CLS_TRANSACTION_CONTEXT_IDENTIFIER);
        if (_.isNil(existingTransaction)) {
            return null;
        }

        return existingTransaction;
    }

    /**
     * Sets the provided transaction for the current CLS context.
     * Throws an expection if a transaction has already been set unless the `overwriteExisting` parameter has been set (defaults to `false`).
     *
     * @param {Sequelize.Transaction} transaction Transaction to set for current CLS context
     * @param {boolean} [overwriteExisting=false] Optionally allows for an existing transaction to be overwritten, defaults to `false`
     * @memberof ConnectionAdapter
     */
    public setTransaction(transaction: Sequelize.Transaction, overwriteExisting: boolean = false): void {
        if (!usingClsHooked) {
            const existingTransaction: Sequelize.Transaction = CLS_NAMESPACE.get(CLS_TRANSACTION_CONTEXT_IDENTIFIER);
            if (!_.isNil(existingTransaction) && !overwriteExisting) {
                throw new Error(`ConnectionAdapter.setTransaction: transaction ${(<any>existingTransaction).id} already exists, cannot set another transaction`);
            }

            CLS_NAMESPACE.set<Sequelize.Transaction>(CLS_TRANSACTION_CONTEXT_IDENTIFIER, transaction);
        }
    }

    /**
     * Removes any set transaction from the current CLS context.
     * Has no effect if no transaction has been set before.
     *
     * @memberof ConnectionAdapter
     */
    public clearTransaction(): void {
        if (!usingClsHooked) {
            CLS_NAMESPACE.set(CLS_TRANSACTION_CONTEXT_IDENTIFIER, null);
        }
    }


    protected destroyConnectionAdapter(): void {

        logger.warn("ConnectionAdapter.destroyConnectionAdapter...");

        dataloaderResetCache();

        if (this._sequelize) {
            this._sequelize.close();
        }

        this._sequelize = null;

        logger.debug("ConnectionAdapter: Destroyed connection.");
    }

    protected async initConnectionAdapter(customInitializedSequelizeInstance: Sequelize.Sequelize = null, fatalErrorExitsProcess = true) {

        let attempt = 0;

        try {

            if (customInitializedSequelizeInstance !== null) {

                await bluebirdRetry(async () => {

                    attempt += 1;

                    logger.debug({
                        ...CONNECTION_RETRY_CONFIG,
                        attempt,
                    }, "ConnectionAdapter.initConnectionAdapter: testing connection of passed sequelize instance...");

                    try {
                        // test if the passed sequelize instance can authenticate...
                        await customInitializedSequelizeInstance.authenticate();

                        logger.debug({
                            ...CONNECTION_RETRY_CONFIG,
                            attempt,
                        }, "ConnectionAdapter.initConnectionAdapter: successfully connected to the database through the passed sequelize instance.");
                    } catch (e) {

                        logger.error({
                            ...CONNECTION_RETRY_CONFIG,
                            attempt,
                            error: e
                        }, "ConnectionAdapter.initConnectionAdapter: connection attempt of the passed sequelize instance has failed!");

                        throw e;

                    }

                }, CONNECTION_RETRY_CONFIG);

                logger.debug("ConnectionAdapter.initConnectionAdapter: initialized & authenticated");
                this._sequelize = customInitializedSequelizeInstance;

                return; // we are done.

            }

            const {
                database,
                username,
                password,
                ...restPGConfig
            } = this.CONFIG.pgConnection;

            // Sequelize instance
            this._sequelize = await <Promise<Sequelize.Sequelize>>bluebirdRetry(async () => {

                attempt += 1;

                logger.debug({
                    ...CONNECTION_RETRY_CONFIG,
                    attempt,
                    database,
                    host: restPGConfig.host,
                    port: restPGConfig.port,
                    pool: restPGConfig.pool
                }, "ConnectionAdapter.initConnectionAdapter: attempting to initialize sequelize...");

                try {
                    const seq = new Sequelize(database, username, password, _.defaults({
                        logging: (query) => {
                            logger.trace(query);
                        }
                    }, {
                            ...restPGConfig,
                            dialect: "postgres",
                            native: true,
                        }));

                    logger.debug({
                        ...CONNECTION_RETRY_CONFIG,
                        attempt,
                        database,
                        host: restPGConfig.host,
                        port: restPGConfig.port
                    }, "ConnectionAdapter.initConnectionAdapter: sequelize initialized, testing connection through authenticate...");

                    await seq.authenticate();

                    logger.debug({
                        ...CONNECTION_RETRY_CONFIG,
                        attempt,
                        database,
                        host: restPGConfig.host,
                        port: restPGConfig.port,
                        pool: restPGConfig.pool
                    }, "ConnectionAdapter.initConnectionAdapter: initialized & authenticated");

                    return seq;

                } catch (e) {

                    logger.error({
                        ...CONNECTION_RETRY_CONFIG,
                        attempt,
                        database,
                        host: restPGConfig.host,
                        port: restPGConfig.port,
                        error: e
                    }, "ConnectionAdapter.initConnectionAdapter: connection attempt has failed!");

                    throw e;
                }
            }, CONNECTION_RETRY_CONFIG);

        } catch (e) {

            console.error(e);

            if (fatalErrorExitsProcess) {
                logger.fatal({
                    ...CONNECTION_RETRY_CONFIG,
                    error: e
                }, "ConnectionAdapter.initConnectionAdapter: could no connect to database, exiting process");
                process.exit(1);
            }

            logger.fatal({
                ...CONNECTION_RETRY_CONFIG,
                error: e
            }, "ConnectionAdapter.initConnectionAdapter (silent): could no connect to database, but we keep running - attention we are potentially in an unrecoverable state!");

            throw e;

        }

    }

}

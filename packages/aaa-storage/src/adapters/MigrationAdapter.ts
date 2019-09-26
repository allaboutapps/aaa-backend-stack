import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import * as Sequelize from "sequelize";
import * as Umzug from "umzug";
import Query from "../Query";
import { ConnectionAdapter, IConnectionAdapterConfig } from "./ConnectionAdapter";
import { IMigration } from "../IMigration";
export interface IMigrationAdapterConfig extends IConnectionAdapterConfig {
    modelMigrationsDirectory: string;
}

export interface IMigrateUpOptions {
    // optional, return false to skip migration execution
    beforeMigrationFile?: (migrationName: string, absolutePathToMigration: string) => Promise<boolean>;
}

export class MigrationAdapter<TConfig extends IMigrationAdapterConfig> extends ConnectionAdapter<TConfig> {

    protected _umzug = null;

    // Utility functions
    public async dropAllTables(checkForAndDeleteOrphanedSequences: boolean = true): Promise<void> {
        logger.info("MigrationAdapter.dropAllTables: starting...");

        const results = await this._sequelize.getQueryInterface().dropAllTables();

        logger.info({ results }, "MigrationAdapter.dropAllTables: finished with dropping");

        if (checkForAndDeleteOrphanedSequences) {

            logger.info({ results }, "MigrationAdapter.dropAllTables: checking for orphaned sequences...");

            const dropQuery = await this._sequelize.query(Query.getDropAllSequencesPlainQuery(), { plain: true, raw: true, type: this._sequelize.QueryTypes.SELECT });

            if (dropQuery === null || _.isString(dropQuery.statement) === false) {
                logger.info({ dropQuery }, "MigrationAdapter.dropAllTables: no sequence drop query was received, noop. done.");
                return Promise.resolve();
            }

            logger.info({ dropQuery }, "MigrationAdapter.dropAllTables: found orphaned sequences. executing...");

            const { ...dropResults } = await this._sequelize.query(dropQuery.statement, { plain: true, raw: true, type: this._sequelize.QueryTypes.SELECT });

            logger.info({ dropResults }, "MigrationAdapter.getDropAllSequencesPlainQuery was executed");
        }

    }

    public async migrateUp(all = true, log = true, options?: IMigrateUpOptions): Promise<void> {
        const self: MigrationAdapter<TConfig> = this;

        // Get list of pending migrations
        let migrations = await self._umzug.pending();

        // Check if all or one migration should be run
        if (!all) {
            if (migrations.length > 0) {
                migrations = [migrations[0]];
            }
        }

        await Promise.each(migrations, async (migration: any) => {

            const migrationName = migration.file.split(".")[0];

            if (_.isFunction(options && options.beforeMigrationFile)) {
                const shouldBeExecuted = await options.beforeMigrationFile(migrationName, migration.path);
                if (shouldBeExecuted === false) {
                    logger.trace({
                        migrationName,
                        migrationPath: migration.path
                    }, "migrateUp.beforeMigrationFile: skipped migration");
                    return;
                }
            }

            const resolvedMigration: IMigration = require(migration.path);
            const inTransactionAppendix = resolvedMigration.executeInTransaction === false ? " (no transaction)" : "";

            if (log) {
                logger.info("=== Migrating: " + migrationName + inTransactionAppendix + "...");
            }

            const migrationHandler = async (tx) => {
                await self._umzug.up(migrationName).catch((e) => {
                    logger.fatal({
                        error: e
                    }, "MigrationAdapter.migrateUp: Encountered fatal error while migrating " + migrationName + inTransactionAppendix + "!");
                    throw e;
                });
                if (log) {
                    logger.info("=== Migrated: " + migrationName + inTransactionAppendix + "!");
                }
            };

            if (resolvedMigration.executeInTransaction === false) {
                // don't execute this in a transaction!
                return migrationHandler(null);
            }

            return self.transaction((transaction) => {
                return migrationHandler(transaction);
            });
        });

        return;
    }

    // TODO: migrating down is currently non-tranactional, does not follow IMigration interface semantics!
    public async migrateDown(log = true): Promise<void> {
        const self: MigrationAdapter<TConfig> = this;
        // Migrate down

        const migrations = await self._umzug.down();
        for (let i = 0, migration; (migration = migrations[i]); i++) {
            if (log) {
                let migrationName = migration.file.split(".")[0];
                logger.info("=== Reverted: " + migrationName + "");
                logger.info("=== MigrationAdapter.migrateDown: done");
            }
        }
    }

    protected destroyMigrationAdapter(): void {
        logger.warn("MigrationAdapter.destroyMigrationAdapter...");
        this._umzug = null;
    }

    protected initMigrationAdapter(pathToModelMigrationsDirectory: string, customInitializedUmzug): void {

        if (customInitializedUmzug) {
            this._umzug = customInitializedUmzug;
            logger.debug("MigrationAdapter.initMigrationAdapter: initialized (received outer managed umzug)");
            return;
        }

        // Setup umzug
        this._umzug = new Umzug({
            storage: "sequelize",
            storageOptions: {
                sequelize: this._sequelize
            },
            migrations: {
                path: pathToModelMigrationsDirectory,
                pattern: /^\d+[\w-]+\.js$/,
                params: [
                    this._sequelize.getQueryInterface(),
                    Sequelize
                ]
            }
        });

        logger.debug("MigrationAdapter.initMigrationAdapter: initialized");
    }

}

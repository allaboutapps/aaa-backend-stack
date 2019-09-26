import { Storage } from "./index";
import { CLI, defineCLIEnvironment } from "@aaa-backend-stack/build-tools";
import { fastDropAndCreate } from "./TestStrategyClass";
import * as _ from "lodash";
import * as path from "path";
import { execAsync } from "@aaa-backend-stack/utils";
import { FS_EXTRA } from "@aaa-backend-stack/build-tools";
import * as SEQUELIZE from "sequelize";

const pkg = require("../package.json");

export interface IInjectCLIOptions {
    setUserPassword: {
        fn: (userUid: string, password: string) => Promise<void | any>;
        defaultPassword: string;
        defaultUserUid: string;
    };
    import: () => Promise<any>;
    additionalCommands: { [commandName: string]: (parsedArgs: any) => Promise<void | any> };
    additionalArgs: {
        // from CLI typings
        [long: string]: { 0: string | boolean, 1: string, 2?: string, 3?: any }
    };
}

export function injectCLI(storage: Storage, options: Partial<IInjectCLIOptions>) {

    const commands = {
        "drop": storage.dropAllTables.bind(storage),
        "forced-drop-and-create": async () => {
            storage.disconnect();
            await fastDropAndCreate(storage.CONFIG.pgConnection);
            await storage.reinitialize();
            await storage.isInitialized();
        },
        "migrate": storage.migrateUp.bind(storage),
        "migrate-up": storage.migrateUp.bind(storage, false),
        "migrate-down": storage.migrateDown.bind(storage),
        "drop-and-migrate": async () => {
            await commands.drop();
            await commands.migrate();
        },
        "drop-migrate-and-import": async () => {
            await commands.drop();
            await commands.migrate();
            await commands.import();
        },
        "set-user-password": async (parsedArgs) => {

            CLI.info(`setting new password '${parsedArgs.password}' for user uid '${parsedArgs.userUid}'...`);
            if (options.setUserPassword) {
                await options.setUserPassword.fn(parsedArgs.userUid, parsedArgs.password);
            } else {
                CLI.info("no setUserPassword.fn defined");
            }
        },
        "import": async () => {
            if (options.import) {
                await options.import();
            } else {
                CLI.info("no import defined");
            }
        },
        "import-sql-dump": async ({ sqlFile }) => {

            storage.disconnect();

            if (sqlFile === null) {
                throw new Error("Absolute path to sqlFile must be specified via -f");
            }

            const absolutePathToFile = path.resolve(sqlFile);

            const exists = await FS_EXTRA.pathExists(absolutePathToFile);

            if (exists === false) {
                throw new Error(`${absolutePathToFile} path does not exist!`);
            }

            // TODO: replace this shell exeCommand with a direct sql connection through pg-native!
            const exeCommand = `sh -c "PGPASSWORD=${storage.CONFIG.pgConnection.password} psql --file ${absolutePathToFile} -U ${storage.CONFIG.pgConnection.username} -d ${storage.CONFIG.pgConnection.database}"`;

            const [stdout, stderr] = await execAsync(exeCommand);

            if (stderr.length > 0) {
                throw new Error("importFromSQLDump failed e=" + stderr);
            }

            CLI.info("imported sql dump");
        },
        "check-missing-fk-indices": async () => {

            // via https://www.cybertec-postgresql.com/en/index-your-foreign-key/
            const rows: { table: string; columns: string; referenced_table: string; constraint: string; size: string }[] = await storage.sequelize.query(`
                    SELECT c.conrelid::regclass AS "table",
                           /* list of key column names in order */
                           string_agg(a.attname, ',' ORDER BY x.n) AS columns,
                           pg_catalog.pg_size_pretty(
                              pg_catalog.pg_relation_size(c.conrelid)
                           ) AS size,
                           c.conname AS constraint,
                           c.confrelid::regclass AS referenced_table
                    FROM pg_catalog.pg_constraint c
                       /* enumerated key column numbers per foreign key */
                       CROSS JOIN LATERAL
                          unnest(c.conkey) WITH ORDINALITY AS x(attnum, n)
                       /* name for each key column */
                       JOIN pg_catalog.pg_attribute a
                          ON a.attnum = x.attnum
                             AND a.attrelid = c.conrelid
                    WHERE NOT EXISTS
                            /* is there a matching index for the constraint? */
                            (SELECT 1 FROM pg_catalog.pg_index i
                             WHERE i.indrelid = c.conrelid
                               /* the first index columns must be the same as the
                                  key columns, but order doesn't matter */
                               AND (i.indkey::smallint[])[0:cardinality(c.conkey)-1]
                                   @> c.conkey)
                      AND c.contype = 'f'
                    GROUP BY c.conrelid, c.conname, c.confrelid
                    ORDER BY pg_catalog.pg_relation_size(c.conrelid) DESC;
                `, { type: SEQUELIZE.QueryTypes.SELECT });

            // node_v10+ supported.
            console.table(rows);

            _.map(rows, (row) => {
                const sanitizedTable = row.table.split("\"").join("");
                const sanitizedFK = row.columns.split("\"").join("");
                // tslint:disable-next-line:no-console
                console.log(`CREATE INDEX idx_${_.snakeCase(sanitizedTable)}_fk_${_.snakeCase(sanitizedFK)} ON "${sanitizedTable}" ("${sanitizedFK}");`);
            });
        },
        ...(options.additionalCommands ? options.additionalCommands : {})
    };

    const args = {
        // setUserPassword available?
        ...(options.setUserPassword ? {
            userUid: ["u", "set-user-password command: user uid to set a new password for", "string", options.setUserPassword.defaultUserUid], // default root UserUid
            password: ["p", "set-user-password command: the new password to set", "string", options.setUserPassword.defaultPassword]
        } : {}),
        ...(options.additionalArgs ? options.additionalArgs : {}),
        sqlFile: ["f", "destroy-and-import-sql-dump command: full absolute path to sql file", "string", null] as any
    };

    return defineCLIEnvironment({
        name: `${pkg.name} CLI`,
        version: pkg.version,
        commands,
        args
    } as any);

}




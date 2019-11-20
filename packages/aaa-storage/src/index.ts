import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as Sequelize from "sequelize";
import * as Umzug from "umzug";
import * as uuid from "uuid";

export { uuid as UUID };
export { Sequelize as SEQUELIZE };
export { Umzug as UMZUG };

export { Query } from "./Query";
export { IMigration } from "./IMigration";
export { sqlAsync } from "./sqlAsync";
export { injectCLI } from "./cli";

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/sequelize",
    "@types/uuid",
    "@types/pg",
    "dataloader-sequelize",
    "sequelize",
    "pg",
    "pg-hstore",
    "pg-native",
    "umzug",
    "uuid"
];

export {
    IBulkData,
    IFixtureTrees,
    IFixtureTreeItem,
    IDefaultModelAttributes,
    IDefaultParanoidModelAttributes,
    IModelFactoryFunctionsMap,
    IModelAdapterConfig,
    ModelAdapter
} from "./adapters/ModelAdapter";

export {
    IStorageStrategyConfig,
    TestStrategy,
    fastDropAndCreate,
    checkDatabaseExists,
    getMigrationsFileMD5s,
    CONNECTION_RETRY_CONFIG
} from "./TestStrategyClass";

// db-helpers...
export {
    addValueToEnum,
    getModelName,
    getOrderByEnumLiteral,
    IEnumLiteralOptions,
} from "./dbHelpers";


/**
 * Helper function to allow SQL syntax highlighting using the vscode-sql-template-literal extension
 * (https://marketplace.visualstudio.com/items?itemName=forbeslindesay.vscode-sql-template-literal)
 * 
 * Usage: const query = sql`SELECT * FROM bla`;
 * 
 * @param query 
 */
export function sql(strings, ...values) {
    let str = "";
    strings.forEach((string, i) => {
        const v = values[i];
        if (typeof v === "function") {
            str += string + v();
        } else if (v !== undefined) {
            str += string + v;
        } else {
            str += string;
        }
    });
    return str;
}

export { findMissingForeignKeyIndices } from "./cli";


import * as transactionContext from "./transactionContext";
export { transactionContext as TRANSACTION_CONTEXT };

import { IStorageAdapterConfig, StorageAdapter } from "./adapters/StorageAdapter";
export { IStorageAdapterConfig, StorageAdapter } from "./adapters/StorageAdapter";

// export our singleton default storage (alias type Storage and IStorageInstanceConfig)
// this storage also automatically used by the exposed testStrategy 
import storageSingleton from "./storageSingleton";

// empty class (allow to overwrite Storage.models from consumers)
// This 2 classes must live here so overwriting of their interface definition from consumers works properly!
export class Storage extends StorageAdapter<any> { }
export type IStorageInstanceConfig = IStorageAdapterConfig;
const storage: Storage = storageSingleton;
export default storage;

// export function __TESTS__() {
//     require("./tests");
// }

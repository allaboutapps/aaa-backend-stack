import * as path from "path";

import { IStorageAdapterConfig } from "@aaa-backend-stack/storage";
export { IStorageAdapterConfig } from "@aaa-backend-stack/storage";

export const storage: (utcOffset: string) => IStorageAdapterConfig = (utcOffset: string): IStorageAdapterConfig => ({
    modelMigrationsDirectory: path.resolve(__dirname, "../migrations/"),
    pgConnection: {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        username: process.env.PGUSER,
        timezone: utcOffset
    },
    modelDefinitions: null // NOTE: must be injected later in index.ts or setup.ts (don't evaluate models while setting up config)!
});

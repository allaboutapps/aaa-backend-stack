import { IStorageInstanceConfig } from "./index";
import * as Client from "pg-native";

export interface ISQLAsyncOptions {
    username: string;
    password: string;
    host: string;
}

export function sqlAsync(sqlQueries: string[], config: ISQLAsyncOptions, database: string = "template1"): Promise<any> {
    const pgClient = Client();

    const connect: (sqlQuery: string) => Promise<any> = Promise.promisify(pgClient.connect, {
        context: pgClient
    });

    const query: (sqlQuery: string) => Promise<any> = Promise.promisify(pgClient.query, {
        context: pgClient
    });

    // Important: We need to connect to /template1 in order to create new databases from template
    // `postgres`, else we have open connections on db `postgres` and creating new databases fails.
    return connect(`postgresql://${config.username}:${config.password}@${config.host}/${database}`)
        .then(() => {
            return sqlQueries;
        })
        .mapSeries((sqlQuery: string) => query(sqlQuery))
        .then((res) => {
            pgClient.end();
            return res;
        });
}

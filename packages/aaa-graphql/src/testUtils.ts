import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import gqlTag from "graphql-tag";
const glob = require("resolve-glob");

const resolveGlobPromisified: (str: string) => Promise<string[]> = Promise.promisify(glob);
const readFilePromisified = Promise.promisify(fs.readFile);

let initialized = false;
export let loadedQueries: any = {};
export interface IGQLQueriesInitializeOptions {
    pathGlobToGraphQLFiles: string;
}

export async function initializeGQLQueries(options: IGQLQueriesInitializeOptions): Promise<void> {

    const files = await resolveGlobPromisified(options.pathGlobToGraphQLFiles);

    const results = await Promise.map(files, (file) => {
        return readFilePromisified(file).then((query) => {
            return {
                file: path.basename(file, ".gql"),
                query: query.toString()
            };
        });
    });

    loadedQueries = _.reduce(results, (sum, item) => {
        sum[item.file] = item.query;
        return sum;
    }, loadedQueries);
    initialized = true;
}

export function getGQLQuery(name: string): any {

    if (initialized === false) {
        console.error("GQLQueries: not initialized");
        throw new Error("GQLQueries: not initialized: " + name);
    }

    if (_.isUndefined(loadedQueries[name])) {
        console.error("GQLQueries: Tryed to get undefined query: " + name, "Available are: ", _.keys(loadedQueries));
        throw new Error("GQLQueries: Tryed to get undefined query: " + name);
    }

    return gqlTag`${loadedQueries[name]}`;
}

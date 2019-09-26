import CONFIG from "../configure";

import * as path from "path";

import { CLI, defineCLIEnvironment } from "@aaa-backend-stack/build-tools";
import { generateTypings, introspectAndGenerate } from "@aaa-backend-stack/graphql-rest-bindings";
import * as REST from "@aaa-backend-stack/rest";

if (CONFIG.env !== "introspect") {
    throw new Error("introspect.ts is only allowed to run in the 'introspect' environment.");
}

// tslint:disable-next-line:no-floating-promises
defineCLIEnvironment({
    name: `${CONFIG.pkg.name} introspect CLI tools`,
    version: CONFIG.pkg.version,
    commands: {
        server: execute.bind(global, "server"),
        refresh: execute.bind(global, "refresh")
    }
});

async function execute(command: "server" | "refresh") {

    const BASE_URL = `http://${CONFIG.rest.host}:${CONFIG.rest.port}`;

    const graphQLIntrospectionOptions = {
        graphqlEndpoint: `${BASE_URL}/api/v1/graphql`,
        schemaPath: path.join(__dirname, "../../introspect/graphql/schema"),
        queriesPath: path.join(__dirname, "../../introspect/graphql/"),
        nodeModulesPath: path.join(__dirname, "../../node_modules"),
        outputFile: path.join(__dirname, "../../src/test/IGQLQueries.d.ts")
    };

    // only refresh typings from previously introspected server without starting up server?
    if (command === "refresh") {
        CLI.info("INTROSPECT: Refreshing...");
        CLI.info(await generateTypings(graphQLIntrospectionOptions));
        process.exit(0);
    }

    // full introspection (graphql and swagger.json)
    CLI.info("INTROSPECT: Starting server...");
    const api = new REST.SERVER.Api(CONFIG.rest);
    await api.ready;
    await api.startServer();

    await Promise.all([
        introspectAndGenerate(graphQLIntrospectionOptions),
        REST.SWAGGER.introspect({
            swaggerJSONRemoteUrl: `${BASE_URL}/documentation/swagger.json`,
            swaggerJSONTargetUrl: path.join(__dirname, "../../introspect/swagger.json")
        })
    ]);
}

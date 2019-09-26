import * as fs from "fs";
import * as path from "path";
import { CLI } from "@aaa-backend-stack/build-tools";

import { generateTypings, IGenerateTypingsOptions } from "./generateTypings";
import { introspect, IIntrospectResponse } from "./introspect";

export interface IExtraIntrospectAndGenerateOptions {
    graphqlEndpoint: string;
    additionalHeaders?: object;
}

export type IIntrospectAndGenerateOptions = IGenerateTypingsOptions & IExtraIntrospectAndGenerateOptions;

export async function introspectAndGenerate(options: IIntrospectAndGenerateOptions) {
    CLI.info(`GRAPHQL: Introspecting graphql schema from ${options.graphqlEndpoint}...`);
    const introspectResult = await introspect(options.graphqlEndpoint, {
        ...(options.additionalHeaders ? options.additionalHeaders : {})
    });

    fs.writeFileSync(
        `${options.schemaPath}/schema.json`,
        JSON.stringify(introspectResult.jsonSchema, null, 2)
    );

    CLI.info(`GRAPHQL: Generated ${options.schemaPath}/schema.json`);

    fs.writeFileSync(
        `${options.schemaPath}/schema.gql`,
        introspectResult.graphQLSchema
    );

    CLI.info(`GRAPHQL: Generated ${options.schemaPath}/schema.gql`);

    const typingsInfo = await generateTypings(options);

    CLI.info(typingsInfo);
}

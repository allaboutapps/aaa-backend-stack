import * as path from "path";
import * as fs from "fs";
import { CLI } from "@aaa-backend-stack/build-tools";
export interface ISwaggerIntrospectOptions {
    swaggerJSONRemoteUrl: string;
    swaggerJSONTargetUrl: string;
}

export async function introspect(options: ISwaggerIntrospectOptions) {
    await fetch(options.swaggerJSONRemoteUrl).then(async (swagger) => {

        CLI.info(`SWAGGER: Introspecting swagger.json from ${options.swaggerJSONRemoteUrl}...`);

        const spec = await swagger.json();

        fs.writeFileSync(
            options.swaggerJSONTargetUrl,
            JSON.stringify(spec, null, 2)
        );

        CLI.info(`SWAGGER: Generated swagger.json at ${options.swaggerJSONTargetUrl}`);

        // TODO: introduce https://github.com/swagger-api/swagger-codegen here.

        // const typingsRes = await fetch("http://generator.swagger.io/api/gen/clients/typescript-node", {
        //     method: "POST",
        //     body: JSON.stringify({
        //         spec,
        //     }),
        //     headers: {
        //         "Content-Type": "application/json"
        //     }
        // });

        // const typings = await typingsRes.json();

        // const zippedArchive = await fetch(typings.link);

        // CLI.info(typings);

    });
}

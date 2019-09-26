import { buildClientSchema, introspectionQuery, printSchema } from "@aaa-backend-stack/graphql";

export interface IIntrospectResponse {
    jsonSchema: object;
    graphQLSchema: string;
}

export async function introspect(uri: string, headers: object = {}): Promise<IIntrospectResponse> {

    const schemaRes = await fetch(`${uri}`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "query": introspectionQuery }),
    });

    const jsonSchema = await schemaRes.json();
    const graphQLSchema = printSchema(buildClientSchema(jsonSchema.data));

    return {
        jsonSchema,
        graphQLSchema
    };

}

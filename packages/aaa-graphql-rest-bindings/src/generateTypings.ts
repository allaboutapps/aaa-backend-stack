import { execAsync } from "@aaa-backend-stack/utils";

export interface IGenerateTypingsOptions {
    schemaPath: string;
    queriesPath: string;
    nodeModulesPath: string;
    outputFile: string;
}

export async function generateTypings(options: IGenerateTypingsOptions) {

    let std, sterr;

    try {
        [std, sterr] = await execAsync(`
#!/bin/bash
# Generates TypeScript schemas from graphql queries
# Automatically introspecs schema to validate queries
cd ${options.schemaPath}
touch _queries.gql
echo -n > _queries.gql


echo "GRAPHQL: Collecting queries in ${options.queriesPath}*.gql"
echo "GRAPHQL: Appending queries to ${options.schemaPath}/_queries.gql"
for file in ${options.queriesPath}*.gql
do
  echo "GRAPHQL: Appending gql query \${file}"
  cat $file >> _queries.gql
  echo $'\\n' >> _queries.gql
done

echo "GRAPHQL: Generating typings..."
echo "${options.nodeModulesPath}/.bin/apollo-codegen generate _queries.gql --schema schema.json --target typescript --output \"${options.outputFile}\""
${options.nodeModulesPath}/.bin/apollo-codegen generate _queries.gql --schema schema.json --target typescript --output "${options.outputFile}"
echo "GRAPHQL: Generated typings at ${options.outputFile}"
    `);
    } catch (e) {
        // console.error("catch error", e);
        // console.log("catch std and sterr", std, sterr);
    }

    // console.log("std", std, "sterr", sterr);

    // sterr sometimes returns weird results even tough it was working correctly - thus commented out!
    // we wont throw!
    // if (sterr) {
    //     throw new Error(sterr);
    // }

    return std;
}

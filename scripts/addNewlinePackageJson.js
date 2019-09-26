const _ = require("lodash");

const fs = require("fs");
const path = require("path");
const pkgJSONPath = path.join(process.cwd(), "/package.json")

let packageJson = fs.readFileSync(pkgJSONPath).toString();

packageJson = _.trimEnd(packageJson, "\n");
packageJson += "\n";

fs.writeFileSync(pkgJSONPath, packageJson);

console.log("Added newlines in " + pkgJSONPath);

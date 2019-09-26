const FS_EXTRA = require("fs-extra");
const path = require("path");
const _ = require("lodash");
const fs = require("fs");

console.log("# ")
console.log("# 🤓  Copy + execute the following in **your consuming project** to link all aaa-backend-stack provided packages:")
console.log("# ----------------------");
console.log("");

const pkgInstructions = _.map(FS_EXTRA.readdirSync(path.resolve(__dirname, "../packages")), (dir) => {
    const absoluteDir = path.resolve(__dirname, "../packages", dir);

    if (fs.statSync(absoluteDir).isDirectory() === false) {
        return;
    }

    // read the project's package.json .main field to get to know the target build path.
    const pkg = require(path.resolve(absoluteDir, "package.json"));

    if (pkg.private === true || pkg.name === "create-aaa-backend") {
        return; // not an public package
    }

    // else log instructions for linking in the customer project
    return "yarn link " + pkg.name;

});

const typingsInstructions = _.map(FS_EXTRA.readdirSync(path.resolve(__dirname, "../node_modules/@types")), (dir) => {
    const absoluteDir = path.resolve(__dirname, "../node_modules/@types", dir);

    if (fs.statSync(absoluteDir).isDirectory() === false) {
        return;
    }

    // read the project's package.json .main field to get to know the target build path.
    const pkg = require(path.resolve(absoluteDir, "package.json"));

    if (pkg.private === true || pkg.name === "create-aaa-backend") {
        return; // not an public package
    }

    // else log instructions for linking in the customer project
    return ("yarn link " + pkg.name);

});

const instructions = _.compact(_.uniq(_.union(pkgInstructions, typingsInstructions)));

_.each(instructions, (instruction) => {
    console.log(instruction);
});

console.log("");
console.log("# ----------------------");
console.log("# 🤓  Afterwards, the easiest way to test changes against **your consuming project** and ensure the have the latest compiled changes is to execute something like the following: ")
console.log("# cd /aaa-backend-stack/ && yarn tsc-sync && cd /vagrant/ && yarn test")
console.log("");

const FS_EXTRA = require("fs-extra");
const path = require("path");
const _ = require("lodash");
const fs = require("fs");
const child_process = require("child_process");

const dirs = FS_EXTRA.readdirSync(path.resolve(__dirname, "../node_modules/@types"));

_.each(dirs, (dir) => {
    const absoluteDir = path.resolve(__dirname, "../node_modules/@types", dir);

    if (fs.statSync(absoluteDir).isDirectory() === false
        || dir === "apollo-errors"
        || dir === "zxcvbn"
        || dir === "graphql-sequelize") {
        return;
    }

    const res = child_process.execSync(`cd ${absoluteDir} && yarn unlink`);
    console.log(res.toString());
});
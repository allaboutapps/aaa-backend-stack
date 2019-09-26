// copy files from "../build/<pkg>/src" to their respective "../packages/<pkg>/build" or "../packages/<pkg>/lib" folders
const FS_EXTRA = require("fs-extra");
const path = require("path");
const _ = require("lodash");
const fs = require("fs");

const dirs = FS_EXTRA.readdirSync(path.resolve(__dirname, "../build"));

_.each(dirs, (dir) => {
    const absoluteDir = path.resolve(__dirname, "../build", dir);

    if (fs.statSync(absoluteDir).isDirectory() === false) {
        return;
    }

    const src = absoluteDir + "/src";

    // read the project's package.json .main field to get to know the target build path.
    const pkg = require(path.resolve(__dirname, "../packages", dir, "package.json"));
    const buildDir = path.dirname(pkg.main);

    const dest = path.resolve(__dirname, "../packages/", dir, buildDir);

    FS_EXTRA.removeSync(dest);
    FS_EXTRA.copySync(src, dest);

});
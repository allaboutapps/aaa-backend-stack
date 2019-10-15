#!/usr/bin/env node

const _ = require("lodash");
const path = require("path");
const pkgJSONPath = path.join(process.cwd(), "/package.json")
const pkg = require(pkgJSONPath);
const fs = require("fs");

const resolutions = {};

// these dependency pattern to allow to use non strict versions (internal typings)
const EXCLUDE_PATTERNS = [
];

function checkCanBeExcluded(dependency) {
    return _.reduce(EXCLUDE_PATTERNS, (sum, excludePattern) => {
        if (dependency.indexOf(excludePattern) === 0) {
            return true;
        } else {
            return sum;
        }
    }, false);
}

_.each(_.keys(pkg.dependencies), (dependency) => {
    if (dependency.indexOf("@types/") === 0 && checkCanBeExcluded(dependency) === false) {
        resolutions[dependency] = pkg.dependencies[dependency];
    }
});

_.each(_.keys(pkg.devDependencies), (devDependency) => {
    if (devDependency.indexOf("@types/") === 0 && checkCanBeExcluded(devDependency) === false) {
        resolutions[devDependency] = pkg.devDependencies[devDependency];
    }
});

pkg.resolutions = resolutions;

fs.writeFileSync(pkgJSONPath, JSON.stringify(pkg, null, 2));

console.log("Wrote resolutions to " + pkgJSONPath);
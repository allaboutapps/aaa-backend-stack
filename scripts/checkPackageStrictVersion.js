const _ = require("lodash");

const path = require("path");
const pkgJSONPath = path.join(process.cwd(), "/package.json")
const pkg = require(pkgJSONPath);
const semver = require("semver");

const res = [];

// these dependency pattern to allow to use non strict versions
const EXCLUDE_PATTERNS = [
    "@aaa-backend-stack/",
    "@types/graphql-sequelize",
    "@types/zxcvbn",
    "@types/apollo-errors",
    "template-aaa-backend"
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

_.each(pkg.dependencies, (a, b) => {

    if (checkCanBeExcluded(b) === false && semver.clean(a) !== a) {
        res.push(b + "@v" + a)
    }

});

_.each(pkg.devDependencies, (a, b) => {

    if (checkCanBeExcluded(b) === false && semver.clean(a) !== a) {
        res.push(b + "@v" + a)
    }

});

if (res.length > 0) {
    console.error("Warning: version is not strict and thus invalid", pkg.name, res);
    console.log("");
    console.log("Please fix package", pkg.name);
    console.log("");
    console.log("");
    process.exit(1);
} else {
    console.log("Successfully checked " + pkgJSONPath);
}


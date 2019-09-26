# aaa-backend-stack package

This packaged is managed inside the [aaa-backend-stack](https://git.allaboutapps.at/projects/AW/repos/aaa-backend-stack/) monorepo.

## How to create a new tslint rule
* Create a new file src/myLintRule.ts 
* The name of the rule in tslint.json will be derived from the file name. E.g. noNewDateRule.js will be referenced as no-new-date in tslint.json
* For a short description of how to write the rule look [here](https://palantir.github.io/tslint/develop/custom-rules/)
* For more detailed examples look at [Microsoft's internal tslint rules](https://github.com/Microsoft/tslint-microsoft-contrib)



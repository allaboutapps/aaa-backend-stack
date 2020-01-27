# aaa-backend-stack

> Base packages to build a Node.js backend at all about apps

This monorepo is managed by [lerna](https://github.com/lerna/lerna) + [yarn](https://yarnpkg.com/lang/en/).

### Quickstart

```bash

# 1. Install lerna in the correct version on your local system, yarn v1.1+
local$ npm install -g lerna@v2.6.0

# Optional: In case you have installed before, wipe modules to start fresh
local$ yarn clean-modules

# 2. Start the dev dm (we use 10.0.0.10 by default, make sure this is available)
local$ vagrant up && vagrant ssh

# 3. Install lerna on the VM in the same version (yarn is already installed)
vagrant$ cd /vagrant && sudo npm install -g lerna@v2.6.0

# 4. install all dependencies inside ./packages
# (will copy ./defaults into @aaa-backend-stack/* scoped libs and bootstrap dependencies through lerna)
vagrant$ yarn bootstrap

# Have you never run this project before: you need to run...
yarn tsc && yarn tsc-sync
# ... once to compile the custom tslint ruleset

# 5. Compile all packages (faster on local host)
local$ yarn build

# 6. Run all tests
vagrant$ yarn test # execute test in all packages --> lerna run test --stream

# 7. LOCALLY: build + watch for changes in all packages (tsc compiler) - most performant (you may also trigger this from vscode)
local$ yarn watch

# Now start changing things...

```

### Publishing

```bash
#
# 0.1 Update CHANGELOG.md!
#

# 0.2 Your git is clean and pushed to the origin
local$ git status

# 1. Consistance check!
# * ensure no single yarn.lock exists directly in the packages
# * add yarn resolutions,
# * properly reformat package.jsons in all packages
# * check if you properly pinned all dependencies, so an exact version is loaded
# * and reshow git status
local$ yarn check-package-validity && git status

#
# Coffee-Break!
# Is your git still clean? Else go back to step 0.
#

# 1.1 Check scaffolded project compiles and lints correctly
# This is necessary due to different (stricter) compiler and linter
# settings in scaffolded projects
local$ yarn create-aaa-backend scaffold -xly --debug

# Start container
local$ cd aaa-backend && yarn docker:up

# Now check that scaffolded project in aaa-backend still compiles
container$ yarn && yarn build && yarn test

# Fix compiler and linter erros until all is well.
# Then copy the fixes to the template.

# Then destroy the docker setup and go back to aaa-backend-stack
local$ yarn docker:destroy && cd .. && rm -rf aaa-backend

# 2. clean all node_modules in root and at the packages level
local$ yarn clean-modules

# 3. VM: reinstall all dependencies from your current yarn.lock file
vagrant$ yarn bootstrap

# 4. Rebuild all packages
# (we are currently going to directly publish the compiled versions of our packages!)
local$ yarn build

# 5. VM: And run all integration tests...
# (also ensure no ownership warnings are raised!)
vagrant$ yarn test

#
# Coffee-Break!
# Is your git still clean? Else go back to step 0.
#

# 7. All fine? Let publish!

# 7.1. Make sure we are going to publish to the public npm registry
local$ npmrc

# 7.2. Check which packages will be updated
local$ lerna updated

# 7.3. Decide on major, minor or patch version in the interactive publish...
# (make sure git is clean before running this + ensure you comply to semver!)
local$ lerna publish

# 8.1 Make sure you do NOT have a global create-aaa-backend installed
local$ create-aaa-backend
# Should return
-bash: create-aaa-backend: command not found

# 8.2 Finally: Publish to public github (so that the templat can be pulled) and then 
# test if create-aaa-backend scaffolding still works
local$ npx create-aaa-backend scaffold -y --debug

```

### Pushing to public github
```bash
# 1. Merge into master-github branch
local$ git checkout master-github
local$ git merge --strategy-option theirs --allow-unrelated-histories --squash master
local$ git commit -m "merge latest"

# 2. Tag the version using same version number as on master without the v (e.g. v1.16.1 -> 1.16.1)
local$ git tag 1.16.1

# 3. Push to github
local$ git push origin-github
local$ git push origin-github 1.16.1
```

### I want to add a dependency

1. Add it to the respective `package.json` of the package and run `yarn bootstrap`. The dependency is now available in our package.
2. Don't forget to properly pin the version and potenially add it to the `__OWNS__` array every package exposes.
3. Allow others to use it. export it from the package (eventually through side-loading / dynamic import) in `UPPER_CASE`.

### I want to create a new @aaa-backend-stack/package

1. Copy packages/aaa-example-lib as a starting point and update the `package.json` and `README.md` file.
2. Write some logic...
3. Import the new dependency in another package by adding it to the `package.json`
4. Finally run `yarn bootstrap`.

### Thoughts on hoisting

Pay close attention to the `"hoist": true` and `"useWorkspaces": true` parameter inside `lerna.json`, it is absolutely mandadory!
We require a flattened node_modules structure as we operate in the global scope within our polyfills.

* See https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/
* See https://github.com/lerna/lerna/blob/c590d57fa0736950ae4820932176d71ceca61587/doc/hoist.md

### Testing create-aaa-backend scaffold

Typically the `create-aaa-backend` CLI tool clones the latest **tagged** release from the `master` branch, and loads the template from there.
If you like you can specify to load it from another branch's `HEAD` by using the `-b BRANCH_NAME` flag.

However, typically you want to test and operate locally while playing within the monorepo, therefore use the following:

```bash

# Useful for testing *.cabgen execution (without docker setup):
local$ yarn create-aaa-backend scaffold -xly --debug # skip docker, use local files, yes to all

# Useful for CI:
ci$ yarn create-aaa-backend scaffold -y --debug # (attention: this still uses the remote published packages from @aaa/npm)

```

### Other useful commands

```bash

# open all managed packages in visual studio code
local$ lerna exec code .

```

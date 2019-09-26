# aaa-backend-stack TODOs

All *TODOs* for **any** package in the whole @aaa-backend-stack will and should be collected in this file!

> We prioritize ...

Try to tag one or more of the following categories:

* **consistance**: issues affecting the integrity of the whole stack (database, library API-wise)
* **tooling**: issues affecting the daily dev business, making it harder and/or longer to actually build the project without this automation
* **performance**: issues affecting the memory / CPU utilization or slow execution of the service
* **security**: issues affecting the security of the stack as a whole
* **bug**: well, it's a bug...
* **oss**: anything holding us back from releasing this project on GitHub / official npm
* **community**: tickets not related to aaa business, but to the open source community

> … and follow semver.

Any *TODO* which is will potentially result in **major breaking changes** — multiple file refactors in upstream project consumers — should be flagged with **[BREAKING]** and must be released in a **new major X.0.0** @aaa-backend-stack version, potentially after going through a series of pre-releases! 

Discarded (and never implemented TODOs) may be flagged as **[WONTFIX]**, any already implemented TODO can be deleted.

Try to **deprecate** API libs gracefully between **minor 0.X.0**  @aaa-backend-stack versions. Please try to give an estimation of the required work to implement your TODO.

### Whole Stack TODOs
* **8h - oss / consistance**: Upgrade to @nmueller's tslint.json
* **24h - oss / consistance / tooling / security**: DOCUMENTATION OVERHAUL (e.g. graphql, rest-layer --> all to tsdocs).
* **8h - oss / consistance**: ensure any errors forwarded to bunyan in our packages, are passed through the `err` parameter. + use tslint/typings enforcement
* **16h - oss / performance**: Upgrade to ES6 compile target to take advantage to native Node.js Promise handling (performance) and other ES6 speed-ups
* **16h - oss / consistance / security**: Switch to typescript strict mode (optional, potential problems)
* **16h - consistance**: Write a `@aaa-backend-stack/worker` package unifying our worker application stack.
* **24h - consistance**: Write a `@aaa-backend-stack/iap` package unifying our in app purchase procedure.
* **8h - tooling**: @mhoesel pre commit hook forbidding `describe.only` and `it.only` in all `*.test.ts` files.
* **?h - community**: Guides - provide deployment guides for azure, aws, gcp, ...
* **8h - consistance**: "Am I the only unique package in this process?". Runtime check if package hoisting from the stack works as intended. 

### @aaa-backend-stack/build-tools
* **8h - consistance**: Check/Ensure only a single version of a `aaa-backend-stack/*` package is installed in the whole project `node_modules` (to ensures hoisting is working properly). Symtoms might be something like unexpected calls to `getChildLogger`, unexpected `storage.transaction` handling (lost CLS context), etc.
* **24h - consistance**: proper env_vars overwrite. automatically generate cli arguments from defined env variables. e.g. like [parity](https://github.com/paritytech/parity/wiki/Configuring-Parity) does this.

### @aaa-backend-stack/devtools
* ...

### @aaa-backend-stack/example-lib
* ...

### @aaa-backend-stack/git-info
* ...

### @aaa-backend-stack/graphql
* **4h - oss / consistance**: Move relay node query into @aaa-backend-stack/graphql package
  * This will furthermore prevent empty graphql endpoints on full deletion of the sample queries in the template
* **16h - oss**: document all mapping / helper functions in the graphql package!
* **24h - [BREAKING]** **oss / security / performance**: upgrade to latest graphql and graphql-sequelize
* **24h - consistance**: Timezone less validated primitive types for GraphQL
  * **consistance**: `GraphQLType` date without time and without timezone --> usecase: `date_of_birth`
  * **consistance**: `GraphQLType` date and without timezone --> usecase: `date_recurrent_email`
  * **consistance**: `GraphQLType` date+time without timezone --> usecase: `opening_hours_at_date`
  * **consistance**: `GraphQLType` time without timezone --> usecase: `time_recurring_daily_email`
* **24h - security**: Add Row-Level-Security example through `sequelize.transaction({role: xxx, parameters: { xxx }})` and update queries and mutations helpers to globally use this behaviour (eventually through the context)
* **16h - consistance**: Allow to fully transform the result from a sequelize `TYPE` (customize how the final serialization will take place). This is AFAIK not possible in the `after` handler (receives a full sequelize `Instance`) as other resolvers might depend on it. E.g. set exposed `user.username` to a computed value `(username) => { return username + "_modified" }` **without** using a `VIRTUAL` field or changing the actual model. Especially useful for hotfixes / deprecation. Eventually this should be done through a custom typeMapper?
  * **consistance**: Allow to fully overwrite base `resolve` generated normally through `resolveListType`, `resolvePaginatedOffsetListType`, `resolveListType` to e.g. use a different base root from a service. Therefore allow associations still to work, while we totally replace the query which gets actually used.
* **8h - consistance**: Give `customFields` resolve fn full access to resolved `Instance` in the current context (e.g. building advanced virtual fields with async access to other models).
* **16h - consistance**: Allow to conditionally include additional depending models if the `orderBy/defaultOrderBy` requires it to do its actual sorting (like `whereMap/defaultWhereMap` works). 
* **16h - bug / consistance**: `defaultOrderBy/orderBy` executed on included models (from the outher scope) is not deterministic, workarounds like [here](https://github.com/sequelize/sequelize/issues/4553) and [here](https://github.com/sequelize/sequelize/issues/7510) help neighter. Might be a sequelize 3 issue, see `types.ts/AppUserProfile.defaultOrderBy`
* **8h - consistance**: Provide a way to easily deprecate `whereMap` / `orderBy` fields (both for documentation and functionality).
* **8h - consistance**: Allow to properly set the default value for `defaultOrderBy` (global) and `orderBy` (resolver).
* **?h - [WONTFIX] / tooling**: Installing `@playlyfe/gql` as dev dep causes hoisting to break unless `resolutions` are specified in the consuming project. Auto generate resolutions?
* **?h - [BREAKING] tooling**: Recheck typescript strict mode support for generating interface definitions of queries / mutations (introspect)
  - **REVERTED in v1.6.2!**: `resolveListType --> []` and `resolvePaginatedOffsetListType --> .nodes[]` are now properly encapsulated with `GraphQLNonNull`.
  - sequelize association handling: `belongsTo` association should lead to `GraphQLNonNull`, while `hasOne` is allowed to be `null`.

### @aaa-backend-stack/graphql-rest-bindings
* **?h - oss**: fix graphql-voyager warnings
* **?h - consistance**: explicitly force react and react-dom (potentially it will be better to supply an explicit static generation package via next.js for hapi for serve all debug pages, provide a base for email template generation etc.)
* **?h - [WONTFIX] / tooling** (minor): add a swagger like static documentation generator, eventually use https://github.com/2fd/graphdoc

### @aaa-backend-stack/logger
* **4h - oss / tooling**: specially cover Boom errors with attached Joi validation errors, by additionally logging the faulty non scheme compliant payload for easier debugging. 
* **2h - consistance**: pin sendmail
* **4h - tooling** (minor): special logger env mode: log request / responses payload / body only for quick debugging or while developing tests (no unneccessary `console.log` statements)

### @aaa-backend-stack/mailer
* **12h - feature**: Email templates should be able to be sent in the users language --> sendgrid only concern?
  * i18n for backend — react?

### @aaa-backend-stack/polyfills
* ...

### @aaa-backend-stack/pushes
* **4h - oss / bug**: recheck typings for PromiseLike (from node-apn) to Bluebird - there is an inconsisty issue currently with the latest TypeScript 2.8.1
* **8h - consistance** (minor): cleanup/deprecate this f**king mess
* **4h - consistance**: allow multiple instances of `pushProvider` (e.g. one for normal, one for voip pushes)
* **8h - oss / features / deprecation**: *Attention* GCM will be deprecated with April 11 2019, migrate the lib to Firebase Cloud Messaging.
* **2h - consistance** (minor): `apnProvider` --> `pushProvider` (deprecate)

### @aaa-backend-stack/rest
* **4h - oss / consistance**: ensure `.test.ts|js` is not resolved as hook file inside hook directory
* **16h - [BREAKING]** **oss / security / performance**: upgrade to latest hapi
* **16h - oss**: document all decorators / utils
* **24h - consistance**: Timezone less validated primitive types for JOI schemas
  * **consistance**: implement an ISO compliant `JOI` schema date without time and without timezone --> usecase: `date_of_birth`
  * **consistance**: implement an ISO compliant `JOI` schema date and without timezone --> usecase: `date_recurrent_email`
  * **consistance**: implement an ISO compliant `JOI` schema date+time without timezone --> usecase: `opening_hours_at_date`
  * **consistance**: implement an ISO compliant `JOI` schema time without timezone --> usecase: `time_recurring_daily_email`
* **?h - [WONTFIX] / bug / consistance**: REST.routes.method[] is lower-/uppercase and thus inconsistent!

### @aaa-backend-stack/serverdate
* ...

### @aaa-backend-stack/storage
* **4h - oss / consistance**: ensure `.test.ts|js` is not resolved as migration file inside migrations directory
* **8h - oss / bug**: ensure `storage.initialize` is not resolved while first template database gets initialized and migrated (no slaves are available yet). Only activate it after the first slave is available.
* **24h - [BREAKING]** **oss / security / performance**: upgrade to latest sequelize v4 (v3 is no longer maintained) and dataloader-sequelize!
* **32h - tooling**: fully autogenerate sequelize typings (like https://github.com/sequelize/sequelize-auto but for our usecase (associations and mixins))
* **24h - consistance**: Timezone less validated primitive types for Sequelize / PostgreSQL
  * **consistance**: json-serialization date without time and without timezone --> usecase: `date_of_birth`
  * **consistance**: json-serialization date and without timezone --> usecase: `date_recurrent_email`
  * **consistance**: json-serialization date+time without timezone --> usecase: `opening_hours_at_date`
  * **consistance**: json-serialization time without timezone --> usecase: `time_recurring_daily_email`
* **4h - bug**: storage-strategy report values might get miscomputed if timekeeper is active during tests. See [timekeeper#30](https://github.com/vesln/timekeeper/issues/30)
* **4h - bug**: `storage.transaction()` is currently always resolving to `Promise<any>`. A generic return type `Promise<T>` would be way better. However, ensure not to `Promise<Promise<T>>` and keep an eye on the overloads.

### @aaa-backend-stack/test-environment
* **4h - oss / bug**: recheck typings for PromiseLike (from chai-http / chai-promise) to Bluebird - there is an inconsistency issue currently with the latest TypeScript 2.8.1
* **2h - oss / bug**: ensure tests can only be executed when in `NODE_ENV=test`, disallow all others.
* **8h - tooling** (minor): dynamically skipping tests through `this.skip()` (`it.skip(...your test...)` unaffected) still resets database - see [this mocha issue](https://github.com/mochajs/mocha/issues/2148)
* **4h - tooling**: inform about creation/updating of snapshots while the tests run

### @aaa-backend-stack/utils
* **4h - oss**: document all utils
* **?h - [WONTFIX] / tooling** (minor): enable repl mode with full project context available

### create-aaa-backend
* **12h - tooling** (minor): allow to rerun `.cabgen` files for migrating existing template projects to new changes.

### template
* **2h - oss / consistance**: properly set `onUpdate` and `onDelete` on migration for `UserPermission`. Look through all migrations (eventually fully remove `onUpdate`).
* **8h - oss / security / consistance**: save used hashing algorithm (`spec.id`) in user database so it's easily possible to later switch to a newer spec.

* **4h - oss / tooling**: Add [istanbul](https://www.npmjs.com/package/istanbul) for automatic code coverage tests (incl. vscode editor integration)

* **?h - tooling** (minor): k8s deployment

* **?h - [WONTFIX] / tooling** (minor): **netdata** set pg_hba.conf -- migrate in all template projects (cabgen reexecute?!
  ```
  # IPv4 local connections:
  host all all 127.0.0.1/32 trust
  ```

* **?h - [WONTFIX] / consistance** (minor): `PushTokens_unique_deviceType_deviceToken` not migrated!

* **4h - tooling / security**: fatal service error shutdown: w8 for error email to successfully be sent to our operations team (disable receiving requests for the whole service in the meantime), timeout automatically after an specific interval. Really important, currently we wait `10000ms` until the server gets terminated because of this problem!

* **?h - [WONTFIX] / security / consistance**: make our auth stack fully compliant to common OAuth2 specs e.g. [rfc8252](https://tools.ietf.org/html/rfc8252)

### tests
* **16h - oss**: some sample tests must be supported (e.g. weird special case (with additional migrations / models / controllers) from an actual customer project)
* **8h - tooling / consistance / bug**: implement package wide tests template tests which will not be exposed through the scaffolder (template regression testing)

### tslint-rules
* **8h - oss / security / consistance**: prevent use of `storage.sequelize.transaction`
* **8h - consistance**: try / catch should always use an "err" property so we properly hand this off to Bunyan

### types-apollo-errors
* ...

### types-graphql-sequelize
* **8h - oss**: upgrade typings to latest graphql-sequelize

### types-zxcvbn
* ...

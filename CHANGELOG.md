### Master
* ...

### 2.0.1
* fix cls.test

### 2.0.0
* update lodash to 4.17.15
* update moment to 2.24.0
* update moment-timezone to 0.5.26
* update cls-bluebird to 2.1.0
* node versions supported 8, 10 and 12
* switched from continuation-local-storage to cls-hooked

### 1.16.9
* upgrade ts-lint to 5.20.0
* fix linter rules

### 1.16.8
* add nodemailer-smtp-transport

### 1.16.7
* update typescript to 3.6.4
* update nodemailer to 6.3.1

### 1.16.0 - 1.16.6
* Fixes for first fully working oss version

### 1.15.13
* template: cabgen
    * add pghero pw
    * add root user uid
    * add permission uids
* add MIT license

### 1.15.12
* template: fix postgres versions in all.yaml.cabgen file.

### 1.15.11
* graphql: fixes invalid `totalCount` for `resolvePaginatedOffsetListType` when `before` handlers on type or resolver were explicitly adding `where` or `include` restrictions.

### 1.15.10
* pushes: fixes title not in alert object for ios push notifications
* template: fixes `test/types.test.ts` import order linting

### 1.15.9
* graphql: allow to customize pagination default limits (defaultNodesLimit, maxNodesLimit, defaultNodesOffset)

### 1.15.8
* template: fix pen-testing encountered user enumeration on non email users (via customer project).
* template: updated ansible provision to install postgres 11 by default
* template: added automatic deploy to staging environment to drone config
* template: properly set onDelete and onUpdate on migrations
* rest, template: removed uid label on Joi type for better debugability

### 1.15.7
* graphql, polyfills, storage. graphql-sequelize: update sequelize from 3.30.4 to 3.31.0 to have support for enum values in arrays. See also [Sequelize v3.31.0](https://github.com/sequelize/sequelize/releases/tag/v3.31.0)

### 1.15.6
* pushes: don't force sound for silent pushes

### 1.15.4
* pushes: support silent push notifications in iOS

### 1.15.3
* devtools: added interval with client ping to keep connection alive without logs, added extra colours and match for HTTP methods

### 1.15.2
* template: fixes assetsStatic.controller tslint

### 1.15.1
* template: fixes assetsStatic.controller typing

### 1.15.0
* template: Fixes inert static files controller issues with trailing `/` leading to fatal server errors (tries to resolve to directory with is forbidden)
* monorepo: Fixed README.md for initial setup (tslint rules build missing)
* [DISABLED currently - non working] drone: added `yarn audit` / `npm audit` (convert to `package-lock.json` via synp) subtask 
* pushes: use fcm endpoint now by default (gcm endpoint is deprecated as of April 10 2019), payload handling still works the same. Fruthermore adds additional log messages to push cli tool (`yarn push [ios|android]`).

### 1.14.13
* storage: adds new storage cli command `yarn db check-missing-fk-indices`

### 1.14.12
* pushes: parse message parameter in cli tool
* rm `nsp` as this project is now deprecated
* add istanbul for coverage reports

### 1.14.11
* pushes: fixing parameter parsing on push notification cli tool

### 1.14.10
* storage: `destroySlaveDBsOnSwitch` after fixed timeout of `5000ms`, silent warning if it does not exceed but no test failure.

### 1.14.9
* template: fixed ansible script for setting up pghero. Added extra table create for history stats + cronjobs
* file-storage-local: properly applied `ignoreMissing` option when reading
* storage: adds `destroySlaveDBsOnSwitch` flag to TestStrategy options, default to `true` if `process.env.CI` is set. Automatically wipes no longer used databases after switching.

### 1.14.8
* fixed synchronized: when the wrapped function throws, synchronized hangs on the last promise and it's error. Fixed by resetting the mutexPromise.

### 1.14.7
* file-storage-local: changed to using content as strings/buffers since `fs.writeFile` does not support `ReadStreams`

### 1.14.6
* file-storage-local: fixed `path.resolve` returning incorrect path in some cases
* all: updated yarn.lock file with latest yarn version. Now includes package integrity checksums

### 1.14.5
* file-storage-local: removed duplicate `this` after lint-autofix

### 1.14.4
* file-storage-local: implemented local file storage service
* file-storage-s3: switched to using `url-join` for creating public URLs, fixed `undefined` return for `listFiles` in case of an exception
* template: set pipefail in tests

### 1.14.3
* logger: `safeConfig` rm `additionalStreams` from error email.

### 1.14.2
* logger: allow to attach `additionalStreams?: Stream[];` to the main bunyan logger and to child loggers from consuming projects.

### 1.14.1
* template: ensure `ssmtp` (SMTP relay) is installed in `Dockerfile` to provide a sendmail binary
* logger: Fix from address, additional metrics in email, html output

### 1.14.0
* monorepo: added drone build pipeline (automated repo and scaffolder tests)
* template/drone: ensure no concurrent pipelines leak into execution, force compress image
* logger: switch error mails to `sendmail` binary by default, switch to `nodemailer` impl.

### 1.13.1
* file-storage-s3: exported AWS SDK namespace

### 1.13.0
* file-storage: started implementing high-level FileStorageService, fully implemented S3FileStorageService (local storage service still only stub)
* image-service: changed ImageService to use FileStorageService for image storage
* template/drone: update default `.drone.yml` configuration, add `.dockerignore` for cabgen

### 1.12.7
* image-service: reverted previous base directory changes and properly changed image file path composition

### 1.12.6
* image-service: switched to including base directory in uploaded image file path. Allows for static asset images to be stored outside of `uploads` folder
* storage/template: `useIntermediateMigrationsCache` is disabled by default in `process.env.CI` environments
* drone: add default `.drone.yml` configuration

### 1.12.5
* image-service: fixed missing types for gm

### 1.12.4
* image-service: added first version of image service using local storage
* logger: fixed single-argument log statements not printing properly
* template: fixed linter issues

### 1.12.3
* utils: properly logged uncaught exception error instead of swallowing it

### 1.12.2
* storage: Modified storage.transaction to support unmanaged transactions. Added jsdoc comments detailing different functionality of `storage.transaction` overloads. Added helper methods for manually setting transaction in CLS context (required for unmanaged transactions). Added `rlsRole` storage config

### 1.12.1
* template: fixes tslint typings issue
* rest: Allow to inject additional cls request context variables through `onNewRequestContext` in `configure/rest` (`baseHooks.onNewRequestContext`).

### 1.12.0
* template: Update `Dockerfile` and forcefully install latest yarn in prepare of k8s deployments
* template: Attention, the `package.json` no longer contains a `prepublish` step, you need to run `yarn build` manually
* template: refactored authentication into separate service (added optional Google + Facebook authentication, refactored auth handlers, added password reset flow/template)
* template: integrated custom tsconfig/tslint rules including tslint-microsoft-contrib
* create-aaa-backend: fixed scaffolder not hashing default password if "yes to all" is enabled
* create-aaa-backend: fixed incorrect `FS_EXTRA.exists` usage
* monorepo: updated all tslint versions to 5.11.0
* template: added foreign keys to sequelize model definition fields
* template: changed ansible provision scripts to install Postgres 10
* template: fixes big incremental backups first run through `--atime-preserve=system`
* polyfills: Properly type `ICLSContext`
* rest: Add default base hook `RequestCLSContextHook`: Create new CLS context in Hapi ifecycle `onPreHandler` (configurable), allow to access the `request` object from everywhere in the chain (`REQUEST_CONTEXT.getRequest()`.
* logger: Allow to configure default log objects through configure: `injectDefaultLogParameters(args): object`
* storage: adds `TRANSACTION_CONTEXT.getTransaction()`
* template: Automatically attach `CTX_REQ_ID` (request id), `CTX_REQ_USER` (authenticated user uid), `CTX_TX_ID` (sequelize transaction id) to all logs (if inside request/transaction chain) To use this in your project:
  * Update `src/configure/rest` to enable the request CLS context handling `requestCLSContext: { enabled: true }`
  * Update `src/configure/logger` to pass default log parameters via `injectDefaultLogParameters`

### 1.11.0
* monorepo: upgrade typescript and tslint to latest
* monorepo: rm tsdoc documentation generation scripts
* monorepo: fix some MacOS/Linux `sed` hacks (we enforce *no* newline in all `package.json`s)
* create-aaa-backend: automatically generate a root user password (hash + salt) while scaffolding
* monorepo: rm old TODOs
* template: no `app/v1` and `api/v1` anymore (everything is `api/v1` now).
* graphql: expose `mappers` util fns, previous only internally available

### 1.10.4
* template: GDPR flags as hard requirements in `/register` endpoint.

### 1.10.3
* rest: bugfix `REST.BASE.createBoom` now properly forwards `errorType`.
* template: updated tests to ensure `errorType` in GPDR legal `PATCH` is returned to clients.

### 1.10.2
* rest: `IStatusCodeDefinition.errorCode` is no longer present
* template: added GDPR related migrations for `AppUserProfile` and introduced `GET` and `PATCH` endpoints for user settings `legalAcceptedAt` and `hasGDPROptOut`.

### 1.10.1
* graphql: Changed handling of GraphQL before/after functions to support Promises
* utils: increase default timeout of `attachGlobalUncaughtExceptionHandler` to `10000ms` until we find a way to wait for successful fatal-error email delivery.

### 1.10.0
* all: updated lodash to v4.17.10 to fix vulnerabilites discovered in v4.17.5 and below
* template: added HAPI hook for injecting `errorType` into error payload (including default "generic" value if omitted)
* rest: Swagger error response documentation now supported multiple errors with same HTTP status code as well as new `errorType` value in error payload

### 1.9.4
* logger: removed `slack.webhook` and `slack.formatter` from `BunyanErrorMailStream` config logging in fatal error email

### 1.9.3
* graphql: exported `toGlobalId` from `graphql-relay` package

### 1.9.2
* monorepo: fixed `yarn unlink-all` error with external typings.
* template: fixes `tsconfig.json` not generated while creating new project through the scaffolder.
* storage: fixes bad storage test strategy reports computed values for slave initialization time.
* storage: cleanup, even faster warmup phase + slaves now also manage umzug instance creation on their own.

### 1.9.1
* monorepo: `yarn link-all` now prints linking instructions to execute in your actual project, making it very easy to consume the stack in consuming projects
* storage: no more `NOTICE` messages via psql bridge on first test run or new storage test slaves
* storage: auto-caching of migrations (not fixtures!) in intermediate database based on their md5 is now activated by default. This should reduce the initial migration warmup phase to ~1sec on subsequent runs, especially in projects with many migration files.

### 1.9.0-3
* logger: now safely "clones" bunyan record (using `safe-json-stringify`) to avoid modifying passed data. `BunyanSlackStream` now also performs an additional `requiredField` check before parsing/omitting if the record is a raw bunyan object (faster)

### 1.9.0-2
* logger: updated `omit-deep` dependency to fix endless recursion/max. call stack issue with omitting `sequelize` objects (strangely worked fine so far?)

### 1.9.0-1
* logger: added optional Slack log stream, allowing for (selective) messages to be sent to a Slack channel

### 1.9.0
* template: rm unused `facebookConfig` binding from env configure
* template: decrease incremental backup threshold (`0.1 --> 0.3`) covering retention cleaning (was not wiped instantly previously)
* template: minor wordings in ansible deploy steps
* all: upgrade to Typescript 2.8.1
* graphql: allow to supply an optional sequelize attribute to graphql scalar typemapper (while initialization)
* graphql: deprecate `IApiRequestContext --> any`. Can be customly specified through generic in template if wanted.
* monorepo: typescript build stack overhaul, now back to faster build times and immediate watch, single compliation and tslint config

### 1.8.9
* pushes: fixed typing for function parameter to satify `microsoft-tslint-contrib` rules
* rest: added missing typings dependency for `handlebars`
* storage: added missing typings dependency for `umzug`

### 1.8.8
* **Important** bogus version, incomplete commit before publish. Use `1.8.9` instead

### 1.8.7
* template: automatically jump to `/vagrant` on sshing via `vagrant ssh` (provisioning .bashrc for VMs)
* template: fixes new node v8 `inspect` protocol debugging setup for visual studio code and vagrant
* template: rm wrong `pinHash` typing from `User` model 
* template: incremental backup smooth out deletion of old backups (threshold)
* utils: exposes `synchronized` (stream like synchonization for all concurrent calls) and `synchronizedBy` (sychronization by unique cache key) async function mutex handler

### 1.8.6
* storage: fixes avgs reported through `testStrategy.printStrategyReport()`
* template: added `Vagrantfile` @aaa-backend-stack/* pkg linking instructions and nfs setup

### 1.8.5
* template: fix ansible group_vars `all.yaml.cabgen` was not updated properly with new default settings.
* pushes: `gcmMock.buildBaseResponse` is no longer private (side-effect-free fn anyways)
* template: react faster to outdated incremental backup deletion.
* rest: fixes `@autoReply` decorator not properly wrapping sychronous `Boom` error throws inside handlers (bubbling up the stack) by enforcing any handler work to happen in v8's nextTick through `Promise.delay(0)` (internally a simple timeout). Any handlers explicitly doing async operations before throwing were unaffected.

### 1.8.4
* logger: enabled silent mode for `sendmail` package in `BunyanErrorMailStream`, preventing console/devtools from being spammed with email logs/content.

### 1.8.3
* tslint: added no new Buffer() rule
* template: added ntpd for vagrant VMs
* template: ansible, provision assets backup as incremental tar stage-1 by default. This is in sync with our current offerings and should free some space at our VMs.
* updated moments and moments-timezone to fix security warning

### 1.8.2
* graphql: Allow empty root mutation schema (GraphQL endpoint without a single mutation defined) and better error message for graphql endpoints without a single root query (every graphql endpoint needs at least one single resolvable query e.g. our Relay compliant `node.query.ts` implemenation).
* utils: Reduce logger severity of skipping malformed (`error` to `warn`) or disabled (`warn` to `debug`) hooks.

### 1.8.1
* graphql: Force `resolvePaginatedOffsetListType` and `resolvePaginatedRelayListType` types with an `include` defined to be run with `distinct: true` by default. This fixes wrongfully returned `totalCount`s (actually the returned count was sum of the associations). Configurable through the `resolverOptions` via `countRootDistinct?: boolean, countAssociatedDistinct?: boolean`.

### 1.8.0
* template: checkPasswordLogin now explicity queries for password and salt is set, else this might lead to `Salt must be a buffer` errors in pbkdf2.
* graphql: Deprecate `include(previousInclude) => [includes]` in favor of more consistant `include(value, previousInclude) => [includes]` (consistent with `where(value, previousWhere) => {where}`). This allows to set inner `include.where` options as you now have access to the parsed args value. Pre 1.8.0 users: This will raise deprecation warnings in your project, simply search+replace `include: (` to `include: (value, `.

### 1.7.1
* logger: explicitly set bunyan standard error serializer (you'll get proper stacktraces in your json logs, no more `error@context`) in logger setup. **important** Use the `err` property when logging with bunyan to properly serialize errors!

### 1.7.0
* build-tools: upgrade `@types/node` to v8
* storage: cli add `yarn db import-sql-dump -f <FILE>` command for easily importing sql files.
* monorepo/template: enables tslints' `no-floating-promises` rule across all libs and the main project. Use `tslint:disable-next-line:no-floating-promises` if you explicitly want unchained behaviour.
* pushes: fixes iOS `ApplePushNotification.send` not awaiting failure `onExpiredToken` hook function before returning results (was running unchained previously).
* utils: allow to further debug pbkdf2 hashing `Salt must be a buffer` errors by fatally logging the input params and type information.

### 1.6.5
* storage: expose `fastDropAndCreate()` and allow to connect/disconnect SalveDBs on TestStrategy through `disconnectSlave`, `reconnectSlave` and `getCurrentSlave` (make it easier to test .sql dumps). `SlaveDB` furthermore exposes its computed `IPGConnectionOptions`.
* monorepo: update lerna to v2.6.0.
* monorepo: fast tsconfig.json global project rebuilding (test only)

### 1.6.4
* test-environment: Instantly print out the absolute path and short error message to the file where a failed test resides (no need to w8 for the whole test completion)
* polyfills: `Buffer.toJSON` is now globally patched to use `Buffer.inspect`. This was done to reduce the memory requirements for the bunyan ringBuffer and exclude big stringified buffer objects (array, byte per line) from our logs. You may disable this handling by setting the env var `DISABLE_GLOBAL_BUFFER_TO_JSON_INSPECT_PATCH` to something truthy.

### 1.6.3
* Upgrade path with vagrant/ansible deployments to Node.js v8 unlocked (`upgrade-node-8.yaml`). Docker images now default to Node.js v8. Run `ansible-playbook -i packages/template/ansible/environments/vm packages/template/ansible/upgrade-node-8.yaml` to resetup your local aaa-backend-stack Vagrant env.
* rest: allow to pass `multiparty.FormOptions` into `extractMultipartPayload(payload, options: multiparty.FormOptions = {})`

### 1.6.2
* graphql: REVERTED! `resolveListType --> []` and `resolvePaginatedOffsetListType --> .nodes[]` encapsulation with `GraphQLNonNull`. `Can only create NonNull of a Nullable GraphQLType`.

### 1.6.1
* template: document `DO NOT ADD YOUR OWN IMPORTS BETWEEN THESE LINES UNLESS YOU KNOW WHAT YOU ARE DOING` in `src/configure/index.ts` and why this is important (initialization order)
* graphql: `resolveListType --> []` and `resolvePaginatedOffsetListType --> .nodes[]` are now properly encapsulated with `GraphQLNonNull`. This should mitigate errors while working with typescript interfaces in strict mode received from introspection (no explicit `!` required for `.[]` property access).

### 1.6.0
* Bigger internal refactor, should be non-breaking.
* `hooks` can now be managed directly through the new `HookLifeCycle` class exposed in `@aaa-backend-stack/utils`. `@aaa-backend-stack/rest`'s `Api` actually inherits from it. This standalone `HookLifeCycle` will become handy for writing **worker** applications (which typically don't need the full api hooks stack).
* `LazyInitializers` static config interfaces were moved to `@aaa-backend-stack/build-tools` to fix potential cyclic deps.
* Removed unneeded dependency on `@aaa-backend-stack/utils` in various packages and fixed missing packages in `graphql`.

### 1.5.11
* **Important** utils: `attachGlobalUncaughtExceptionHandler` now also listens to `unhandledRejection`. Missing promise rejection error handling now forcefully exits the process on these kind of errors after 1sec (enough time to forward an fatal error email). This is in preparation of node8 which will terminate the process by default on this type of errors and furthermore should finally allow us to log these kind of errors.
  - [Node.js docs](https://nodejs.org/api/process.html#process_event_unhandledrejection)
  - [Unhandled Promise Rejections in Node.js](http://thecodebarbarian.com/unhandled-promise-rejections-in-node.js.html)
  - [Bluebird Error management configuration](http://bluebirdjs.com/docs/api/error-management-configuration.html)
* template: `test/setup.ts` now also applies the `attachGlobalUncaughtExceptionHandler(0)` to freak out on sync exceptions or unhandled promise rejections immediately (no timeout (defaults to 1000ms) before killing the process will be applied).
* mailer: `IMailServiceOptions` constructor must now provide a valid `Transporter` for the single required `transporter` property.

### 1.5.10
* template: `test/setup.ts` is now executing database and hook reset procedure **before** (not after) running a test. This saves us one unneccessary reset-execution and furthermore helps with debugging in `trace` severity (no database reset handling at the bottom of the log)!
* graphql-rest-bindings: Fixes false-positive `stderr`s while generating new typings based on preexisting graphql with `yarn introspect server`, `yarn introspect refresh` and `yarn watch`.

### 1.5.9
* storage: Fixes `TestStrategy` did not properly conform to hooks lifecycle. `storage.isInitialized` was resolved before the first slave database was actually setuped. e.g. this prevented graphql tests from being able to limit via `.only`.
* storage: Fixes `yarn db forced-drop-and-create` was not working (storage connection was still present).

### 1.5.8
* **Important** logger: fix `ringBuffer` was no longer appended to fatal error-emails (wrong initialization order).

### 1.5.7
* mailer: expose `NODE_MAILER` and add optional `attachments: AttachmentObject[]` to `IMailServiceSendOptions`.
* mailer: Allow to use the original `SendMailOptions` with a set `template` via `MailService.send` from nodemailer.
* mailer: Expose `MailService.sendPlain` to send non template emails directly through the transporter. Furthermore `IMailServiceOptions.absolutePathToTemplates` is now optional (we no longer require handlebars templates for mail sending)

### 1.5.6
* template/graphql: added node relay-compliant graphql query resolver (can be potentially moved to @aaa-backend-stack/graphql)
* mailer: `MailService.send` is no longer `protected`, but instead `public`. Thus, we no longer enforce inheritance-based application mailers.

### 1.5.5
* graphql: Minor rm unneeded `console.log` statements

### 1.5.4
* graphql: fixes bug in `mapModelAttributesToUpdateArgsAndHandler`: Updates to current `null` values of instance failed to apply properly.
* graphql-rest-bindings: update `graphql-voyager@1.0.0-rc.10` to properly handle `Authorization` header injection (similar to graphiql)
* storage: adds cli command `db forced-drop-and-create` to handle databases not easily dropable through `db drop`.
* template: fixes guest auth controllers and model instance methods
* template: rm ci specific docker capabilities (no longer needed as we w8 until database is available) and pin docker-compose to v2

### 1.5.3
* devtools: another bugfix for static web template while using a custom `wsPath`

### 1.5.2
* devtools: bugfix for static web template while using a custom `wsPath`

### 1.5.1
* devtools: allow to customize websocket path through `wsPath`

### 1.5.0
* monorepo: automatically add resolutions to all typings in the stack through `yarn pin-types-resolutions`
* monorepo: fixes `yarn check-package-strict-version`, use this now before publishing!

### 1.4.6
* forcefully pin `@types/hapi` and `@types/joi` through [yarn resolutions](https://yarnpkg.com/lang/en/docs/selective-version-resolutions/) in `@aaa-backend-stack/rest`.

### 1.4.5
* template: split graphql and graphiql hooks from each other
* stack-documentation: update README.md from teammeeting
* template: fix `CONFIG.routes.assetsUrlHostExternal` is not passed as `externalAssetsUrlHost` to reset password email template 
* allow to supply a custom `hapiServerOptions` to rest `Api` initialization to overwrite the `Hapi.ServerOptions` with constructing a new `Hapi` server
* add [graphql-voyager](https://github.com/APIs-guru/graphql-voyager) to `@aaa-graphql-rest-bindings`. Available at `<scheme>://<SERVER>:<PORT>/documentation/graphql-voyager`

### 1.4.4
* mailer: log error when sending email fails. email sender fix.
* template: add `IDefaultModelAttributes` to all models, add `_modelTemplate`
* template: logging on undeliverable emails for forgotPasswort routes
* storage: better fatal error logging for `storage.migrateUp()` failures in Adapter and testStrategy

### 1.4.3
* template: `yarn test:file` helper and extracted mocha configuration into `.mocha` opts file
* git-info, logger, pushes, serverdate: only warn on reexecuting static `.configure()`
* rest, graphql: only warn on malformed controller through `loadControllersByGlob` or malformed queries/mutations through `loadRootSchemaByGlob`.

### 1.4.2
* template: yarn test:watch npm-script for template (attention updated .nodemon)
* template: document swagger grouping of routes
* logger: never reopen logger file-streams in NODE_ENV==="test"

### 1.4.1
* template: proper postgres version 9.4 in docker common.yaml (same as used with vagrant)
* rest: statusCodes decorator (useful while migrating from routes/handlers to controllers)

### 1.4.0
* rm newrelic from template (must be removed manually in your projects)
* internal specific integration-testing-pre-setup
* strict typescript compiler-settings for various packages (build-tools, devtools, example-lib, git-info, graphql)
* auto-resort package.json
* update ws (devtools)
* better monorepo readme on publishing and quickstart pipeline

### 1.3.4
* update hapi-swagger
* replace date instances in snapshots bei default (iso strings) devtools firefox instructions
* template fix bulkdata/fixtures wrong interface settings

### 1.3.3
* utils now includes `checkFSTmpWriteable`: checks tmp fs is writeable (5MB file). Requires update of monitoring controller for usage.

### 1.3.2
* Template fixes inspect mode - debugging

### 1.3.1
* Template fixes db model interface

### 1.3.0
* `create-aaa-backend update-aaa-packages` to update all @aaa packages
* Storage typings: `IFixtureTreeItem` now allows string arrays.

### 1.2.0
* **Breaking** storage singleton (StorageAdapter class) .init() is now async down to the ConnectionAdapter and tries to estabilish a connection for 30secs
* ConnectionAdapter.transaction() is overloaded and accepts TransactionOptions as first param + new experimental role and global/custom parameters (in preparation for row level security)

### 1.1.0
* Internal storage package refactor (`Connection-`, `Migration-`, `Model-` and `StorageAdapter`).
* **Breaking** TestStrategy setup now requires to construct a new `TestStrategy` and overgive the `StorageAdapter` to manage.

### 1.0.2
* Patch release, broken remote setup in create-aaa-backend

### 1.0.1
* gchen's tslint rules added

### 1.0.0
* Initial internal release

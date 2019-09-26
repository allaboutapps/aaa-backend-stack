import CONFIG from "../configure";

import * as path from "path";

import { gqlTestUtils } from "@aaa-backend-stack/graphql";
import * as REST from "@aaa-backend-stack/rest";
import storage, { TestStrategy } from "@aaa-backend-stack/storage";
import {
    // globalAfter,
    globalAfterEach,
    globalBefore,
    globalBeforeEach,
    snapshots
} from "@aaa-backend-stack/test-environment";
import { attachGlobalUncaughtExceptionHandler } from "@aaa-backend-stack/utils";

import modelDefinitions from "../modelDefinitions";
import fixtures, { fixtureTrees } from "./fixtures";
import Request from "./Request";

// freak out on uncaughtExceptions!
attachGlobalUncaughtExceptionHandler(0);

// construct a new TestStrategy for the default singleton provided storage
const testStrategy = new TestStrategy(storage);

// set the base directory where our snapshot files will live...
snapshots.setSnapshotsBaseDirectory(path.join(__dirname, "../../introspect/snapshots"));

// before starting, reset the db and start the api
globalBefore(async function () {

    await Promise.all([ // concurrently startup the database strategy, init gql utils + initialize our service

        testStrategy.init({
            ...CONFIG.storage,
            modelDefinitions,
            fixtureTrees,
            bulkData: fixtures,
            // there is no need to create an intermediate DB cache while running within the CI env (db wipe after test)
            useMigrationIntermediateDBCache: process.env.CI ? false : true
        }),

        gqlTestUtils.initializeGQLQueries({
            pathGlobToGraphQLFiles: path.join(__dirname, "../../introspect/graphql/*.gql")
        }),

        new REST.SERVER.Api(CONFIG.rest).ready.then(async () => {
            Request.initialize(REST.SERVER.Api.instance); // hook up Request

            return REST.SERVER.Api.instance.startServer();
        })

    ]);

});

// this flag if the database and all hooks should be reset beforce executing a test
let isDatabaseDirty = false;

globalBeforeEach(async function () {

    if (isDatabaseDirty) {
        await testStrategy.switchToNewSlaveDB();
        await REST.SERVER.Api.instance.resetHooks();
    }

    testStrategy.mochaAttachCurrentStorageSlaveInformation(this);
});

globalAfterEach(async function () {
    // if the test was not manipulating data (.it handler used #noreset tag or .describe block used #resetafter)
    // AND passed, don't reset the db and the service hooks (+= performance)
    isDatabaseDirty = testStrategy.mochaIsAllowedToSkipHardStorageReset(this) ? false : true;
});

// debug storage strategy speed
// globalAfter(async function () {
//     testStrategy.printStrategyReport();
// });

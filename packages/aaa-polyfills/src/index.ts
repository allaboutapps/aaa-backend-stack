// setup general global polyfills that need to be applied everything that runs in node directly!
require("source-map-support").install(); // enable sourcemap support for .ts files in node

/*

MANDADORY CLS CONTEXT PROMISE SETUP
What's that?
* http://fredkschott.com/post/2014/02/conquering-asynchronous-context-with-cls/
* https://github.com/othiym23/node-continuation-local-storage

TL;DR
This must be setuped for sequelize transactions to work properly
All used promise dependencies need to be monkey-patched (sequelize supports this by default) to properly preserve the transaction context
Whenever you add a promise implementation to a backend project, be sure to patch + check if nested transactions inside the new promise impl. still preserve the context!

Related errors:
* https://github.com/sequelize/sequelize/issues/3509

*/

const pkg = require("../package.json");

// continuation-local-storage types via https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/continuation-local-storage/index.d.ts
export type IContext = {
    [key: string]: any
};

export type IFunc<T> = (...args: any[]) => T;

export interface ICLSNamespace {
    readonly name: string; // Note: this is readonly because changing it does not actually rename it
    readonly active: IContext; // Note: this is readonly because changing it manually will break functionality
    createContext(): IContext;

    set<T>(key: string, value: T): T;
    get(key: string): any;

    run(callback: IFunc<void>): IContext;
    run<T>(callback: IFunc<T>): IContext;
    runAndReturn<T>(callback: IFunc<T>): T;
    bind(callback: IFunc<void>, context?: IContext): IFunc<void>;
    bind<T>(callback: IFunc<T>, context?: IContext): IFunc<T>;
    bindEmitter(emitter: NodeJS.EventEmitter): void;
}


// setup our own process specific CLS namespace.
const cls = require("cls-hooked");

import * as uuid from "uuid";

export const CLS_NAMESPACE: ICLSNamespace = cls.createNamespace("NS_" + uuid.v4()); // uniquely set per process to prevent collisions betwenn our CLS namespaces.

const Sequelize = require("sequelize");
// apply a context (namespace) in which our sequelize promises will run inside, mandadory to get transactions working properly!
Sequelize.cls = CLS_NAMESPACE; // set the promise execution namespace for sequelize.

// also patch the separate installed bluebird promise package to use the cls namespace
// see https://github.com/sequelize/sequelize/issues/3509
const bluebirdPromise = require("bluebird");
const patchBluebird = require("cls-bluebird");
patchBluebird(CLS_NAMESPACE); // patch...

// --> for facebook/dataloader which does not allow to switch the promise implementation directly!
global.Promise = bluebirdPromise;

// tell fetch to use our version of the cls patched bluebirdPromise
const nodeFetch = require("node-fetch");
nodeFetch.Promise = bluebirdPromise; // patch...

// fetch must exist on the global object (node-fetch typings are installed and tsconfig is updated with that)
(global as any).fetch = nodeFetch;


if (!process.env.HIDE_AAA_POLYFILLS_INFO) {
    // ALWAYS log something out, this polyfill step is mandadory for all backend service processes running node!
    console.log(`Polyfills installed (Promise -> bluebird@v${bluebirdPromise.version}, fetch -> node-fetch@v${pkg.dependencies["node-fetch"]}, CLS=${CLS_NAMESPACE.name}).`);
}

if (!process.env.DISABLE_GLOBAL_BUFFER_TO_JSON_INSPECT_PATCH) {
    // GLOBAL PROTOTYPE PATCH: Dumping giant buffers is always wrong, max pipe them to inspect.
    // you may disable this handling if you really need to, we typically to this so bunyan does not dump a whole buffer into the json log
    // see https://github.com/trentm/node-bunyan/issues/119
    Buffer.prototype.toJSON = (Buffer as any).prototype.inspect;
}

export function __TESTS__() {
    require("./tests");
}

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/bluebird",
    "@types/bluebird-global",
    "@types/node-fetch",
    "bluebird", // exposed as global.Promise
    "cls-bluebird",
    "cls-hooked",
    "node-fetch", // exposed as global.fetch
    "source-map-support"
];

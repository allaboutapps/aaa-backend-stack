import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/storage");

import * as _ from "lodash";
import storage, { IStorageStrategyConfig } from "./index";
import SlaveDB from "./SlaveDB";

const SWITCH_DB_DESTROY_AFTER_MS = 5000; // if initOpts.destroySlaveDBsOnSwitch is enabled, fully destroy database after...

export default class PGTemplatePool {

    readonly initOptions: IStorageStrategyConfig;
    readonly prebufferCount: number = 0;

    private _slaves: SlaveDB[] = [];
    private currentSlave: SlaveDB = null;
    private constructedSlavesCount = 0;

    constructor(initOpts: IStorageStrategyConfig) {
        this.prebufferCount = initOpts.prebufferCount || 8;
        this.initOptions = initOpts;

        // one slave is always necessary to operate the pool
        // tslint:disable-next-line:no-floating-promises
        this.addSlaveSync().ready.then(() => {
            // add the remaining to be prebufferCount slaves deferred as soon as the one is initialized
            return this.addSlavesDeferred(this.prebufferCount - 1);
        });
    }

    get slaves(): SlaveDB[] {
        return this._slaves;
    }

    async getNextSlaveDBName(): Promise<SlaveDB> {

        if (this.currentSlave) {

            // remember ref to slave...
            const closeSlave = this.currentSlave;
            closeSlave.close();

            if (this.initOptions.destroySlaveDBsOnSwitch === true) {
                setTimeout(() => {
                    closeSlave.destroy();
                }, SWITCH_DB_DESTROY_AFTER_MS);
            }
        }

        try {
            const readyInstance = await Promise.any(_.map(_.filter(this._slaves, {
                dirty: false
            }), (slave) => slave.getReadyInstance()));

            this.currentSlave = readyInstance.flagDirty();

            // silently add another slave in a background...
            // tslint:disable-next-line:no-floating-promises
            this.addSlaveDeferred();

            return this.currentSlave;

        } catch (e) {
            console.error("fatal error while getNextSlaveDBNameIdentifier, Pool was exceeded", e);
            throw new Error("getNextSlaveDBNameIdentifier: Unrecoverable Error");
        }

    }

    getCurrentSlaveDBName(): string {
        return this.currentSlave.databaseName;
    }

    getCurrentSlave(): SlaveDB {
        return this.currentSlave;
    }

    private addSlaveSync(): SlaveDB {
        const slave = new SlaveDB(this.constructedSlavesCount, this.initOptions);
        this._slaves.push(slave);
        this.constructedSlavesCount += 1;
        return slave;
    }

    private addSlaveDeferred(): Promise<SlaveDB> {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                resolve(this.addSlaveSync());
            });
        });

    }

    private addSlavesDeferred(count: number): Promise<SlaveDB[]> {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                resolve(_.times(count, (index) => {
                    return this.addSlaveSync();
                }));
            });
        });
    }

}

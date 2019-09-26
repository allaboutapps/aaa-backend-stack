import { getChildLogger } from "@aaa-backend-stack/logger";

import * as crypto from "crypto";
import * as _ from "lodash";

const randomBytes = Promise.promisify(crypto.randomBytes);
const pbkdf2 = Promise.promisify(crypto.pbkdf2);

/**
 * This file holds the hashing definitions which are used within projects
 */

export interface IHashingDefinition {
    readonly SPEC: {
        id: string;
        pbkdf2?: {
            digest: string;
            keyLen: number;
            iterations: number;
            saltLen: number;
        }
    };
    createSalt(): Promise<string>;
    hashPassword(password: string, salt: string): Promise<string>;
}

export const pbkdf2Late2016: IHashingDefinition = new (class implements IHashingDefinition {

    // See https://cryptosense.com/parameter-choice-for-pbkdf2/ (Consider OWASP and NIST recommendations)
    // The following settings were last updated from the recommendations of 11-2016 
    readonly SPEC = {
        id: "pbkdf2Late2016",
        pbkdf2: {
            // ATTENTION, never change these settings!
            digest: "sha512",
            keyLen: 512,
            iterations: 12000,
            // INDEPENDANT, an be changed anytime, old salts are unaffected!
            saltLen: 64
        }
    };

    async createSalt() {
        const salt = await randomBytes(this.SPEC.pbkdf2.saltLen);
        return salt.toString("hex");
    }

    async hashPassword(password: string, salt: string) {
        const { iterations, keyLen, digest } = this.SPEC.pbkdf2;

        try {
            const buf = await pbkdf2(password, salt, iterations, keyLen, digest);
            return buf.toString("hex");
        } catch (err) {
            logFatalPbkdf2Error(err, password, salt, this.SPEC.id);
            throw err; // rethrow
        }
    }
});

export const pbkdf2Early2015: IHashingDefinition = new (class implements IHashingDefinition {

    // These specs were used on the first backend projects at allaboutapps in early 2015
    readonly SPEC = {
        id: "pbkdf2Early2015",
        pbkdf2: {
            // ATTENTION, never change these settings!
            digest: "sha1",
            keyLen: 512,
            iterations: 12000,
            // INDEPENDANT, an be changed anytime, old salts are unaffected!
            saltLen: 32
        }
    };

    async createSalt() {
        const salt = await randomBytes(this.SPEC.pbkdf2.saltLen);
        return salt.toString("hex");
    }

    async hashPassword(password: string, salt: string) {
        const { iterations, keyLen, digest } = this.SPEC.pbkdf2;

        try {
            const buf = await pbkdf2(password, salt, iterations, keyLen, digest);
            return buf.toString("hex");
        } catch (err) {
            logFatalPbkdf2Error(err, password, salt, this.SPEC.id);
            throw err; // rethrow
        }
    }
});

function logFatalPbkdf2Error(err, password, salt, identifier: string) {

    const logger = getChildLogger("@aaa-backend-stack/utils");

    logger.fatal({
        err,
        password,
        salt,
        passwordTypeInformation: {
            passwordStringified: `${password}`,
            type: typeof password
        },
        saltTypeInfo: {
            saltStringified: `${salt}`,
            type: typeof salt
        }
    }, `hashPassword (${identifier}) fatal error: pbkdf2 implementation did throw`);
}

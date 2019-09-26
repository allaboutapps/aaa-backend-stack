import * as _ from "lodash";
import { RingBuffer } from "bunyan";
// Disables all output by sendmail package and prevents the console/devtools from being spammed with email logs/content

import * as nodemailer from "nodemailer";
import * as os from "os";

const prettyjson = require("prettyjson");
const omitDeep = require("omit-deep");

import * as serverdate from "@aaa-backend-stack/serverdate";
import getGitProjectInfo from "@aaa-backend-stack/git-info";

import { IInitializeConfig } from "./IInitializeConfig";
import { getSecureBunyanRecord } from "./util";

const WAIT_FOR_FOLLOWUP_ERRORS_MS = 750; // error collection waiting timeframe

class BunyanErrorMailStream {

    collectedErrors: Array<string>;
    sendErrorMailTimeout: NodeJS.Timer | null;
    logWarning: Function;
    ringBuffer: RingBuffer;
    config: IInitializeConfig;
    transporter: nodemailer.Transporter;

    constructor(_logWarning: Function, _ringBuffer: RingBuffer, _config: IInitializeConfig) {
        this.collectedErrors = [];
        this.sendErrorMailTimeout = null;
        this.logWarning = _logWarning; // bridge to bunyan --> logger.warn
        this.ringBuffer = _ringBuffer;
        this.config = _config;
        this.transporter = _config.errorEmailTransporter
            ? _config.errorEmailTransporter
            : nodemailer.createTransport(require("nodemailer-sendmail-transport")());
    }

    write(bunyanStringRecord: string) { // will be called by bunyan, stream interface

        this.logWarning("BunyanErrorMailStream: received a new fatal error to email");

        // clear any previous timeout schedulers, as they have not been sent yet
        if (this.sendErrorMailTimeout) {
            clearTimeout(this.sendErrorMailTimeout);
            this.sendErrorMailTimeout = null;
            this.logWarning("BunyanErrorMailStream: cleared previous scheduling timeout!");
        }

        // push the new formatted record into...
        this.collectedErrors.push(this.getFormattedMessage(bunyanStringRecord));

        // schedule the new email to send...
        this.sendErrorMailTimeout = setTimeout(() => {

            this.logWarning("BunyanErrorMailStream: Sending email with collected errors...");

            const hostname = os.hostname();

            this.transporter.sendMail({
                from: `"${this.config.bunyanLoggerName}@${hostname}" <${this.config.defaultSender}>`,
                to: this.config.errorReceivers,
                subject: `${this.config.bunyanLoggerName}@${hostname}: ${this.collectedErrors.length} fatal error(s)`,
                html: `<code><pre>`
                    + this.getEmailBodyHeader()
                    + this.getEmailBodyRecords()
                    + this.getRingBufferRecords()
                    + `</pre></code>`
            }, (err: Error, reply: any) => {
                // warn about logging...
                if (err) {
                    this.logWarning("BunyanErrorMailStream: Failed to send email with collected errors!");
                    return;
                }
                this.logWarning("BunyanErrorMailStream: Successfully send error email!");
            });

            // empty our pending collectedErrors as we have already sent them now...
            this.collectedErrors = [];
            this.sendErrorMailTimeout = null;

        }, WAIT_FOR_FOLLOWUP_ERRORS_MS); // wait at least x seconds to send the new email, this allows us to send several errors together in one combined email.
    }

    getFormattedMessage(bunyanStringRecord: string): string {

        const self = this;

        try {
            const secureErrorObject = this.getSecureRawBunyanErrorObject(bunyanStringRecord);
            const rendered = prettyjson.render(secureErrorObject, { noColor: true });
            return rendered;
        } catch (e) {
            console.error(e);
            self.logWarning("BunyanErrorMailStream.getFormattedMessage: Failed to parse bunyanStringRecord for error email delivery." + e);
            return "BUNYAN JSON RECORD PARSING FAILED " + e;
        }
    }

    getSecureRawBunyanErrorObject(bunyanRawRecord: any): any {
        const self = this;
        try {
            const omitted = getSecureBunyanRecord(bunyanRawRecord);
            return omitted;
        } catch (e) {
            console.error(e);
            self.logWarning("BunyanErrorMailStream.getSecureRawBunyanErrorObject: Failed to parse bunyanRawRecord for error email delivery." + e);
            return {};
        }
    }

    getEmailBodyHeader() {
        // Omit slack webhook, formatter and additionalStreams if defined, cleaning up emails and removing sensitive data
        const safeConfig = JSON.parse(JSON.stringify(this.config));
        if (safeConfig.slack) {
            if (safeConfig.slack.webhook) {
                delete safeConfig.slack.webhook;
            }
            if (safeConfig.slack.formatter) {
                delete safeConfig.slack.formatter;
            }
        }

        if (safeConfig.additionalStreams) {
            safeConfig.additionalStreams = `${safeConfig.additionalStreams.length} streams configured`;
        }

        return `
Encountered ${this.collectedErrors.length} fatal error(s) (within a ${WAIT_FOR_FOLLOWUP_ERRORS_MS}ms waiting threshold).
Timestamp: ${serverdate.getMoment().toISOString()}

Git:
${prettyjson.render(getGitProjectInfo(), { noColor: true })}

Uptime:
${os.uptime()}

Memory:
${os.freemem()} Free / ${os.totalmem()} Total

Loadavg:
${os.loadavg()}

Logging Config:
${prettyjson.render(safeConfig, { noColor: true })}

        `;
    }

    getEmailBodyRecords() {
        return this.collectedErrors.map((collectedError, i) => {
            return (`

################################################################################
--- Error #${(i + 1)}
################################################################################

${collectedError}

`           );
        });
    }

    getRingBufferRecords() {
        return (`

################################################################################
--- Trace (RingBuffer records)
################################################################################

${JSON.stringify(_.map(this.ringBuffer ? this.ringBuffer.records : [], this.getSecureRawBunyanErrorObject), null, 2)}

`       );
    }
}

export default BunyanErrorMailStream;

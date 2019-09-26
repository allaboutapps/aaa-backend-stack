import * as _ from "lodash";

import * as serverdate from "@aaa-backend-stack/serverdate";

import { IInitializeConfig } from "./IInitializeConfig";
import { BUNYAN_LEVEL_COLORS, BUNYAN_LEVEL_NAMES, getSecureBunyanRecord } from "./util";

class BunyanSlackStream {
    private config: IInitializeConfig;
    private logWarning: Function;
    private formatter: (record: any, levelName: string, levelColor?: string) => any;

    constructor(_logWarning: Function, _config: IInitializeConfig) {
        this.config = _config;
        this.logWarning = _logWarning; // bridge to bunyan --> logger.warn

        if (_.isNil(this.config.slack)) {
            throw new Error("Slack config required");
        }

        if (_.isEmpty(this.config.slack.webhook)) {
            throw new Error("Slack webhook URL required");
        }

        if (_.isFunction(this.config.slack.formatter)) {
            this.formatter = this.config.slack.formatter;
        } else {
            this.formatter = this.defaultFormatter;
        }
    }

    write(rawBunyanRecord: any) {
        if (!this.config.slack.enabled) {
            return;
        }

        const self = this;

        // Check if `rawBunyanRecord` is actually a raw bunyan record (not a formatted string), if so perform requiredField check before parsing/omitting
        if (_.isPlainObject(rawBunyanRecord) && !_.isEmpty(this.config.slack.requiredField)) {
            const requiredFieldValue = _.get(rawBunyanRecord, this.config.slack.requiredField, false);
            if (!requiredFieldValue) {
                return;
            }
        }

        let bunyanRecord: any;
        try {
            bunyanRecord = getSecureBunyanRecord(rawBunyanRecord);
        } catch (err) {
            console.error(err);
            self.logWarning({ err }, "BunyanSlackStream.write: failed to get secure raw bunyan object");
            return;
        }

        if (!_.isEmpty(this.config.slack.requiredField)) {
            const requiredFieldValue = _.get(rawBunyanRecord, this.config.slack.requiredField, false);
            if (!requiredFieldValue) {
                return;
            }
        }

        const levelName = _.isEmpty(BUNYAN_LEVEL_NAMES[bunyanRecord.level]) ? `Unknown (${bunyanRecord.level})` : BUNYAN_LEVEL_NAMES[bunyanRecord.level];
        let levelColor = _.isEmpty(BUNYAN_LEVEL_COLORS[bunyanRecord.level]) ? undefined : BUNYAN_LEVEL_COLORS[bunyanRecord.level];
        if (_.isString(bunyanRecord.slackColor) && !_.isEmpty(bunyanRecord.slackColor)) {
            levelColor = bunyanRecord.slackColor;
        }

        let formattedBunyanRecord: any;
        try {
            formattedBunyanRecord = this.formatter(bunyanRecord, levelName, levelColor);
        } catch (err) {
            console.error(err);
            self.logWarning({ err }, "BunyanSlackStream.write: failed to format Slack webhook payload");
            return;
        }

        const slackPayload = _.defaults({
            channel: _.isEmpty(this.config.slack.channel) ? undefined : this.config.slack.channel,
            username: _.isEmpty(this.config.slack.username) ? undefined : this.config.slack.username
        }, formattedBunyanRecord);

        if (this.config.slack.dryRun) {
            if (process.env.NODE_ENV !== "test") {
                console.log("BunyanSlackStream DryRun", JSON.stringify(slackPayload, null, 2));
            }
            return;
        }

        try {
            // Asynchronous on purpose so we don't block bunyan/other executions
            // tslint:disable-next-line:no-floating-promises
            fetch(this.config.slack.webhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(slackPayload)
            }).then((res) => {
                if (res.status !== 200) {
                    // tslint:disable-next-line:no-floating-promises
                    res.text().then((body) => {
                        self.config.slack.enabled = false;

                        console.error("BunyanSlackStream", res.status, res.statusText);
                        self.logWarning({ status: res.status, body: body }, "BunyanSlackStream.write: received error from Slack API, disabling logger");
                    });
                }
            });
        } catch (err) {
            console.error(err);
            self.logWarning({ err }, "BunyanSlackStream.write: failed to send message to Slack webhook");
            return;
        }
    }

    private defaultFormatter(record: any, levelName: string, levelColor?: string): any {
        return {
            text: `[${levelName.toUpperCase()}] ${record.msg}`,
            attachments: [{
                color: levelColor,
                fields: [{
                    title: "time",
                    value: serverdate.getMoment().toISOString(),
                    short: true
                }]
            }]
        };
    }
}

export default BunyanSlackStream;

import { Transporter } from "nodemailer";
import { Stream } from "bunyan";

export interface ILoggingConfig {
    console: boolean;
    consoleSeverity: string;
    file: string | null; // null on no file
    fileSeverity: string;
    includeRequestPayload: boolean;
    includeRequestHeaders: boolean;
    includeResponsePayload: boolean;
    opsIntervalMs: number;
    bunyanLoggerName: string;
    // https://github.com/trentm/node-bunyan#stream-type-rotating-file
    fileRotationEnabled: boolean;
    rotationOptions: {
        period: string; // 1d
        count: number; // count of logs to keep
    };
    ringBuffer: {
        enabled: boolean;
        maxEntries: number;
        severity: string;
    };
    slack?: {
        enabled: boolean;
        webhook: string;
        severity?: string | null; // Set to `null` or omit to use default level "info"
        channel?: string | null; // Set to `null` or omit to use default channel for webhook
        username?: string | null; // Set to `null` or omit to use default username for webhook
        // Custom formatting function for Slack webhook payload
        // Should return Slack webhook message object, see https://api.slack.com/docs/messages and https://api.slack.com/docs/messages/builder
        // Set to `null` or omit to use the default formatter
        formatter?: (record: any, levelName: string, levelColor?: string) => any;
        // Only send logs to Slack if a field with this name is trueish on the bunyan record
        // Set to `null` or omit to disable and send all messages to Slack
        requiredField?: string | null;
        // Set to true to enable "dry runs", simply logging the payload to `console.log` instead of sending them to Slack
        // No messages will be printed is `NODE_ENV === "test"` to prevent test-logs from being spammed
        dryRun?: boolean;
    };
    // additional custom bunyan log streams that should be attached
    additionalStreams?: Stream[];
    injectDefaultLogParameters?: (args: any[]) => object;
}

export interface IFatalErrorsEmailConfig {
    sendEmails: boolean;
    defaultSender: string;
    errorReceivers: string;
    errorEmailTransporter?: Transporter; // defaults to use the sendmail binary from the host system 
}

export type IInitializeConfig = ILoggingConfig & IFatalErrorsEmailConfig;

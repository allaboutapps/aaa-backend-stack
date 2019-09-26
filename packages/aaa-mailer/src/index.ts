import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/mailer");

import { join } from "path";
import { defaults, isString, isUndefined } from "lodash";
import * as Handlebars from "handlebars";
import { FS_EXTRA } from "@aaa-backend-stack/build-tools";
const nodemailer = require("nodemailer");

import * as NodemailerNamespace from "nodemailer";
export { NodemailerNamespace as NODE_MAILER };

export interface IMailServiceSendOptions {
    attachments?: NodemailerNamespace.AttachmentObject[];
    data?: Object;
    from?: string;
    template: string;
    to: string;
    subject: string;
}

export interface IMailServiceOptions {
    transporter: NodemailerNamespace.Transporter; // a valid node mailer transporter
    enabled?: any; // any truthy value will evaluate to true
    absolutePathToTemplates?: string;
}

/* also allow the original type */
export type INodeMailerSendMailOptionsWithTemplate = NodemailerNamespace.SendMailOptions & {
    template: string;
};

export function createNodemailerStubTransport(transporterOptions: any = {}): NodemailerNamespace.Transporter {
    return nodemailer.createTransport(require("nodemailer-stub-transport")(), transporterOptions);
}

export function createNodemailerDirectTransport(transporterOptions: any = {}): NodemailerNamespace.Transporter {
    return nodemailer.createTransport(require("nodemailer-direct-transport")(), transporterOptions);
}

/**
 * This class is handling all email transports
 */
export class MailService {

    protected _transporter: any;
    protected _isEnabled: boolean;
    protected _absolutePathToTemplates: string;

    constructor(opt: IMailServiceOptions) {
        this._transporter = opt.transporter;
        this._isEnabled = isUndefined(opt.enabled) ? true : !!opt.enabled;
        this._absolutePathToTemplates = isString(opt.absolutePathToTemplates)
            ? opt.absolutePathToTemplates
            : null;
    }

    // send mails without handlebars template
    public async sendPlain(options: NodemailerNamespace.SendMailOptions) {

        if (!this._isEnabled) {
            return Promise.resolve("MailService.sendPlain: Sending emails is disabled");
        }

        logger.debug({
            options
        }, "MailService.sendPlain: Sending mail...");

        const res = await this._transporter.sendMail(options);

        const { accepted, envelope, messageId, pending } = res;

        logger.info({
            accepted,
            envelope,
            messageId,
            pending,
            options,
        }, "MailService.sendPlain: Successfully sent mail.");

        return res;

    }

    // function to send an email with a handlebars template
    public async send(_options: IMailServiceSendOptions | INodeMailerSendMailOptionsWithTemplate) {

        if (!this._isEnabled) {
            return Promise.resolve("MailService.send: Sending emails is disabled");
        }

        if (this._absolutePathToTemplates === null) {
            throw new Error("IMailServiceOptions.absolutePathToTemplates was not set. You can only send plain mails!");
        }

        const options = defaults(_options, {
            data: {}
        });

        const { from, to, subject, attachments } = options;

        logger.debug({
            from,
            to,
            subject,
            attachments: attachments ? attachments.length : 0
        }, "MailService.send: Sending mail...");

        const templateFile = join(this._absolutePathToTemplates, options.template);
        const content = await FS_EXTRA.readFile(templateFile, "utf8");
        const hbsTemplate = Handlebars.compile(content);
        const html = await hbsTemplate(options.data);

        logger.debug({
            from,
            to,
            subject,
            attachments: attachments ? attachments.length : 0,
            html
        }, "MailService.send: produced html");

        const { template, data, ...sendMailOnlyOptions } = options;

        return this._transporter.sendMail({
            ...sendMailOnlyOptions,
            html
        }).then((res) => {

            const { accepted, envelope, messageId, pending } = res;

            logger.info({
                accepted,
                envelope,
                messageId,
                pending,
                from,
                to,
                subject,
                attachments: attachments ? attachments.length : 0
            }, "MailService.send: Successfully sent mail.");

            return res;
        });
    }

}

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "@types/nodemailer",
    "nodemailer",
    "nodemailer-direct-transport",
    "nodemailer-stub-transport"
];

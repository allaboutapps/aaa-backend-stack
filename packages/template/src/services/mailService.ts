import * as urlJoin from "url-join";

import { createNodemailerDirectTransport, createNodemailerStubTransport, MailService } from "@aaa-backend-stack/mailer";

import CONFIG from "../configure";

export class ApplicationMailService extends MailService {
    async sendPasswordForgot(email: string, passwordResetToken: string) {
        return this.send({
            to: email,
            subject: "Password Forgotten Email",
            template: "email/forgot_password.hbs",
            data: {
                externalAssetsUrlHost: CONFIG.routes.assetsUrlHostExternal,
                passwordResetLink: urlJoin(CONFIG.routes.publicApiUrl, CONFIG.auth.passwordResetEndpoint, passwordResetToken)
            }
        });
    }
}

// see the respective nodemailer transport options...
const DEFAULT_TRANSPORT_OPTIONS = {
    // default values for sendMail method
    from: CONFIG.email.defaultSender
};

export default new ApplicationMailService({
    transporter: CONFIG.env === "test" ? createNodemailerStubTransport(DEFAULT_TRANSPORT_OPTIONS) : createNodemailerDirectTransport(DEFAULT_TRANSPORT_OPTIONS),
    enabled: CONFIG.email.sendEmails,
    absolutePathToTemplates: CONFIG.rest.baseHooks.visionHandlebarsTemplates.absolutePathToTemplates
});

import getGitProjectInfo from "@aaa-backend-stack/git-info";
import * as REST from "@aaa-backend-stack/rest";
import * as serverdate from "@aaa-backend-stack/serverdate";

export class Hook implements REST.SERVER.IHook {

    started: serverdate.MOMENT_TIMEZONE.Moment = null;

    async init(api: REST.SERVER.Api) {
        this.started = serverdate.getMoment(api.server.info.created);
    }

    getInfo(api: REST.SERVER.Api) {

        const uptime = serverdate.getLoggableTimeRepresentation(serverdate.getMoment().diff(this.started));

        return {
            rest: api.getConnectionInfo(),
            started: this.started,
            uptime,
            serverdate: serverdate.getInfo(),
            git: getGitProjectInfo()
        };
    }

}
const hook = new Hook();

export default hook;

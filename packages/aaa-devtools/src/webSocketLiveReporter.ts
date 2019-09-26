import getGitProjectInfo from "@aaa-backend-stack/git-info";
import * as _ from "lodash";
import * as WS from "ws";

import webtemplate from "./webtemplate";
import { IWebSocketLiveReporterOptions } from "./IWebSocketLiveReporterOptions";

// adapted from https://www.npmjs.com/package/reflektor
// hapi 0.8 changes applied from https://github.com/hapijs/hapi/issues/2186
const gitInfo = getGitProjectInfo();

const DEFAULT_OPTIONS: IWebSocketLiveReporterOptions = {
    auth: {
        strategy: "basic-authentication",
        scope: "root",
    },
    endpoint: "/devtools",
    clientWelcomeMessageFn: () => ({
        msg: "up and running"
    })
};

let templateFn: typeof webtemplate = null;

// Declare internals
const internals = {
    webSockets: <WS.Server[]>[],
    defaults: DEFAULT_OPTIONS,
    handler: function (request: any, reply: any) {
        reply(templateFn);
    }
};

exports.register = function (plugin: any, options: IWebSocketLiveReporterOptions, next: any) {

    const wsPath = options.wsPath ? options.wsPath : "/devtools-ws";

    // set the template fn to use...
    templateFn = webtemplate(gitInfo.branch, gitInfo.tag, gitInfo.short, gitInfo.message, wsPath);

    const settings: any = _.defaults(options, internals.defaults);
    plugin.route({
        method: "GET",
        path: settings.endpoint,
        handler: internals.handler,
        config: {
            auth: settings.auth,
        }
    });

    for (let i = 0, il = plugin.connections.length; i < il; ++i) {
        registerServer(plugin.connections[i], options.clientWelcomeMessageFn, wsPath);
    }

    const oldStdout = process.stdout.write.bind(process.stdout);
    process.stdout.write = function (...args: any[]): boolean {

        transmit(args[0]);
        return oldStdout(...args);

    };

    const oldStderr = process.stderr.write.bind(process.stderr);
    process.stderr.write = function (...args: any[]): boolean {

        transmit(args[0]);
        return oldStderr(...args);
    };

    return next();
};


exports.register.attributes = {
    name: "webSocketLiveReporter"
};


function registerServer(server: any, clientWelcomeMessageFn: () => object, wssPath: string) {

    const ws = new WS.Server({ server: server.listener, path: wssPath });
    ws.on("connection", function (socket) {
        // socket.send(JSON.stringify(Api.getServerInfo()));
        socket.send(JSON.stringify({
            ...clientWelcomeMessageFn(),
            __IS_SERVER_INFO__: true // this flag will be used to format the server info differently!
        }));

        const pingInterval = setInterval(function () {
            try {
                socket.ping(null, false, true);
            } catch (err) {
                // silently swallow ping error, most likely caused by client disconnect
                clearInterval(pingInterval);
            }
        }, 10000);
    });

    internals.webSockets.push(ws);
}


function transmit(data: any) {


    internals.webSockets.forEach(function (ws) {

        (ws.clients as any).forEach(function each(client: WS) {
            try {
                client.send(data.toString());
            } catch (err) {
                return false;
            }
        });

    });

}

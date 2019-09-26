import { IWebSocketLiveReporterOptions } from "./IWebSocketLiveReporterOptions";

export function getHapiDevtoolsPlugin(options: Partial<IWebSocketLiveReporterOptions>) {
    return {
        register: require("./webSocketLiveReporter"),
        options
    };
}

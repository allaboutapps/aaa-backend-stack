export interface IWebSocketLiveReporterOptions {
    endpoint: string;
    auth: any;
    clientWelcomeMessageFn: () => object;
    wsPath?: string; // defaults to "/devtools-ws"
}

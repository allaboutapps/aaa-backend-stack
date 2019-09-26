import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/pushes");

import { merge } from "lodash";
import * as url from "url";

import apnProvider from "./apnProvider";

export class GcmMock {

    onMessage = null; // can be overwritten from the outside if needed.
    private _initializedPromise: Promise<any> = null;

    initialize(): Promise<void | any> {

        if (this._initializedPromise) {
            logger.debug("GCMMock was already initialized, noop");
            return this._initializedPromise;
        }

        this._initializedPromise = new Promise((resolve, reject) => {
            try {

                // extract path and port from android url...
                const androidUrl = url.parse(apnProvider.CONFIG.android.url);

                logger.info({
                    port: androidUrl.port,
                    host: androidUrl.host,
                    pathname: androidUrl.pathname
                }, "GcmMock extracted port and path");

                // only require wen initialized.
                const express = require("express");
                const bodyParser = require("body-parser");

                const app = express();

                const self = this;

                app.use(bodyParser.json());
                app.post(androidUrl.pathname, (req, res, next) => {

                    logger.debug({
                        onMessageOverwritten: self.onMessage
                    }, "GcmMock request");

                    if (self.onMessage) {
                        self.onMessage(req, res, next);
                    } else {
                        res.json(self.buildSuccessResponse(req, res, next));
                    }
                });

                app.listen(androidUrl.port, () => {
                    logger.info({
                        port: androidUrl.port,
                        host: androidUrl.host,
                        pathname: androidUrl.pathname
                    }, "GCM Mock Server is running");

                    resolve();
                });

            } catch (e) {
                reject(e);
            }

        });

    }

    buildSuccessResponse(req, res, next) {
        let results = [];

        logger.debug({
            registration_ids: req.body.registration_ids
        }, "GcmMock req.body.registration_ids");

        for (let i = 0; i < req.body.registration_ids.length; i++) {
            results.push({ "message_id": i });
        }
        let successResponse = merge(this.buildBaseResponse(req, res, next), {
            "success": req.body.registration_ids.length,
            "results": results
        });

        logger.debug({
            successResponse
        }, "GcmMock successResponse");

        return successResponse;
    }

    buildBaseResponse(req, res, next) {
        return {
            "multicast_id": 123,
            "success": 0,
            "failure": 0,
            "canonical_ids": 0,
            "results": []
        };
    }
}

const gcmMock = new GcmMock();

export default gcmMock; 

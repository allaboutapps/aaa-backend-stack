import { expect } from "@aaa-backend-stack/test-environment";
import gcmMock from "./gcmMock";
import { AndroidPushNotification } from "./AndroidPushNotification";
import { ApplePushNotification, IAPNContent } from "./ApplePushNotification";
import { Responses } from "apn";
import { sendMessage } from "./sendMessage";

describe("@aaa-backend-stack/pushes", function () {

    before(() => {
        return gcmMock.initialize();
    });

    afterEach(function () {
        gcmMock.onMessage = null;
    });

    // Enable this test to test a hardcoded iOS push notification
    it("should send an ios push notification #noreset", async () => {
        const tokens = ["175faa14804154657af335e4b92ec314640d374af59a5ed7d6c35ed49f9b42b9"];
        const notification: IAPNContent = {
            alert: "\uD83D\uDCE7 \u2709 You have a new message"
        };

        let pnApple = new ApplePushNotification(tokens, notification);
        await pnApple.send();
    });

    it("should send ios push notification through sendMessage func #noreset", async () => {

        const [androidResult, iosResult] = await Promise.all(sendMessage({
            title: "test",
            alert: "\uD83D\uDCE7 \u2709 You have a new message",
            payload: {}
        }, { ios: ["175faa14804154657af335e4b92ec314640d374af59a5ed7d6c35ed49f9b42b9"] }));

        expect((iosResult as Responses).sent.length).to.equal(1);
    });

    it("should send silent ios push notification through sendMessage func #noreset", async () => {

        const [androidResult, iosResult] = await Promise.all(sendMessage({
            contentAvailable: 1,
            payload: { test: 42 }
        }, { ios: ["175faa14804154657af335e4b92ec314640d374af59a5ed7d6c35ed49f9b42b9"] }));

        expect((iosResult as Responses).sent.length).to.equal(1);
    });

    it("should send an android push notification #noreset", function (done) {
        gcmMock.onMessage = (req, res, next) => {
            try {
                expect(req.body).to.have.keys(["registration_ids", "data"]);
                expect(req.body.registration_ids).to.have.length(1);
                expect(req.body.registration_ids[0]).to.equal("token1");
                expect(req.body.data.foo).to.equal("bar");
                res.json(gcmMock.buildSuccessResponse(req, res, next)); // finally fullfill it.
                done();
            } catch (err) {
                done(err);
            }
        };

        let pnAndroid = new AndroidPushNotification(["token1"], { foo: "bar" });

        // tslint:disable-next-line:no-floating-promises
        pnAndroid.send();
    });

    it("should send android push notification through sendMessage func #noreset", (done) => {

        gcmMock.onMessage = (req, res, next) => {
            try {
                expect(req.body).to.have.keys(["registration_ids", "data"]);
                expect(req.body.registration_ids).to.have.length(1);
                expect(req.body.registration_ids[0]).to.equal("token1");
                expect(req.body.data.payload.foo).to.equal("bar");
                res.json(gcmMock.buildSuccessResponse(req, res, next)); // finally fullfill it.
                done();
            } catch (err) {
                done(err);
            }
        };

        // tslint:disable-next-line:no-floating-promises
        Promise.all(sendMessage({
            title: "test",
            alert: "\uD83D\uDCE7 \u2709 You have a new message",
            payload: { foo: "bar" }
        }, { android: ["token1"] }));
    });

    it("should retry on android push notification service (500) status #noreset", function (done) {

        let count = 0;

        gcmMock.onMessage = (req, res, next) => {

            if (count === 0) {
                count += 1;
                return res.status(500).end(); // retry on 500 received error!
            }

            try {
                expect(req.body).to.have.keys(["registration_ids", "data"]);
                expect(req.body.registration_ids).to.have.length(1);
                expect(req.body.registration_ids[0]).to.equal("token1");
                expect(req.body.data.foo).to.equal("bar");
                res.json(gcmMock.buildSuccessResponse(req, res, next)); // finally fullfill it.
                done();
            } catch (err) {
                done(err);
            }
        };

        let pnAndroid = new AndroidPushNotification(["token1"], { foo: "bar" });
        pnAndroid.send().catch(done);
    });

    it("should not retry on android push clientside notification error service (400) status #noreset", function (done) {

        let count = 0;

        gcmMock.onMessage = (req, res, next) => {

            if (count === 0) {
                count += 1;
                return res.status(400).end(); // retry on 500 received error!
            } else {
                throw new Error("you are not supposed to be here");
            }
        };

        let pnAndroid = new AndroidPushNotification(["token1"], { foo: "bar" });
        pnAndroid.send().catch((e) => {

            expect(e.name).to.equal("ApiError");
            expect(e.response.status).to.equal(400);
            done();
        });
    });

});

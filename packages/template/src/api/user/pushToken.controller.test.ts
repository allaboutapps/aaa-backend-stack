import storage from "@aaa-backend-stack/storage";
import { expect } from "@aaa-backend-stack/test-environment";

import Request, { IAvailableTestUsers } from "../../test/Request";

describe("POST /api/v1/pushtoken", function () {

    it("should return return 401 if not authenticated #noreset", async () => {

        const res = await Request.create("POST", "/api/v1/pushtoken").send({
            deviceType: "bla",
            deviceToken: "ABC"
        });
        expect(res).to.have.status(401);
    });

    it("should return 400 on invalid deviceType #noreset", async () => {

        const res = await Request.create("POST", "/api/v1/pushtoken", { user: "user1" }).send({
            deviceType: "bla",
            deviceToken: "ABC"
        });
        expect(res).to.have.status(400);
    });

    it("should accept and save a valid ios push token (retry user overwriting)", async () => {
        await testPushSubscribe("1234567", "ios", "user1", "user2");
    });

    it("should accept and save a valid android push token (retry user overwriting)", async () => {
        await testPushSubscribe("1234567", "android", "user1", "user2");
    });

    it("should accept and save both valid push token device types (retry user overwriting)", async () => {

        await testPushSubscribe("1234567", "android", "user1", "user2");
        await testPushSubscribe("1234567", "ios", "user1", "user2");
        await testPushSubscribe("1234567", "android", "user1", "user2");
        await testPushSubscribe("1234567", "ios", "user1", "user2");

        const tokens = await storage.models.PushToken.findAll({
            where: {
                deviceToken: "1234567"
            }
        });

        expect(tokens.length).to.equal(2);

    });

});

// helper function to test pushToken registration
async function testPushSubscribe(deviceToken: string, deviceType: string, user1: IAvailableTestUsers, user2: IAvailableTestUsers) {
    const res1 = await Request.create("POST", "/api/v1/pushtoken", { user: user1 }).send({
        deviceType,
        deviceToken
    });

    expect(res1).to.have.status(200);

    const res2 = await Request.create("POST", "/api/v1/pushtoken", { user: user2 }).send({
        deviceType,
        deviceToken
    });

    expect(res2).to.have.status(200);

    const pushTokens = await storage.models.PushToken.findAll({
        where: {
            deviceToken,
            deviceType
        }
    });

    expect(pushTokens.length).to.equal(1);
    expect(pushTokens[0].UserUid).to.equal(Request.users[user2].uid); // user2 was updated.
}

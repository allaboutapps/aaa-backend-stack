import { JOI as Joi, types } from "@aaa-backend-stack/rest";
import { expect } from "@aaa-backend-stack/test-environment";

describe("@aaa-backend-stack/rest/types", () => {
    it("should return joi error with key name for invalid uidv4", async () => {
        const res = Joi.validate({ token: "invalidtoken" }, Joi.object().keys({ token: types.uidv4.required() }));
        // Expect key name 'token' in error message. This would not be the case if a label is set on the uidv4 type.
        expect(res.error.message).to.be.equal("child \"token\" fails because [\"token\" must be a valid GUID]");
    });
});

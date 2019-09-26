import { createError } from "@aaa-backend-stack/graphql";

// Not found errors...
export const TEST_ERROR = createError("TEST_ERROR", {
    message: "This is a test error"
});

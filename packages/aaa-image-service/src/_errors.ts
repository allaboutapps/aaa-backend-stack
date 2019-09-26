import * as REST from "@aaa-backend-stack/rest";

export const NOT_FOUND_IMAGE_NOT_FOUND: REST.BASE.IStatusCodeDefinition = {
    code: 404,
    message: "Image not found",
    errorType: "imageNotFound"
};

export const CONFLICT_TOO_MANY_IMAGES: REST.BASE.IStatusCodeDefinition = {
    code: 409,
    message: "Too many images uploaded",
    errorType: "tooManyImages"
};

export const UNSUPPORTED_MEDIA_TYPE_INVALID_IMAGE_FORMAT: REST.BASE.IStatusCodeDefinition = {
    code: 415,
    message: "Invalid image format",
    errorType: "invalidImageFormat"
};

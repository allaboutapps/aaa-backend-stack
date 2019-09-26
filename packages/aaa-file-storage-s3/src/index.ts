export * from "./S3FileStorageService";

import { S3FileStorageService } from "./S3FileStorageService";
export default S3FileStorageService;

import * as awsNamespace from "aws-sdk";
export { awsNamespace as AWS };

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [
    "aws-sdk"
];

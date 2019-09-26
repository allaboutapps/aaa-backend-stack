import * as fs from "fs";
import * as _ from "lodash";
import { S3, config as s3config } from "aws-sdk";
import * as urlJoin from "url-join";

import { getChildLogger } from "@aaa-backend-stack/logger";
const logger = getChildLogger("@aaa-backend-stack/file-storage-s3");

import {
    DEFAULT_DELETE_FILE_OPTIONS,
    DEFAULT_READ_FILE_OPTIONS,
    DEFAULT_WRITE_FILE_OPTIONS,
    IDeleteFileOptions,
    IFileContent,
    IFileInfo,
    IFileStorageService,
    IReadFileOptions,
    IWriteFileOptions
} from "@aaa-backend-stack/file-storage";

export interface IS3FileStorageServiceConfig {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region?: string;
    host?: string;
    port?: number;
    scheme?: string;
    sslEnabled?: boolean;
}

export class S3FileStorageService implements IFileStorageService {
    private config: IS3FileStorageServiceConfig;
    private s3Endpoint: string;
    private s3Client: S3;

    constructor(config: IS3FileStorageServiceConfig) {
        this.config = _.defaults(config, {
            region: "eu-central-1",
            host: "localhost",
            port: 4569,
            scheme: "https",
            sslEnabled: true
        });

        if (_.isEmpty(this.config.accessKeyId) || _.isEmpty(this.config.secretAccessKey)) {
            throw new Error("Missing credentials for AWS S3");
        }
        if (_.isEmpty(this.config.bucket) || _.isEmpty(this.config.bucket)) {
            throw new Error("Missing AWS S3 bucket");
        }

        s3config.setPromisesDependency(require("bluebird"));

        this.s3Endpoint = `${this.config.scheme}://${this.config.host}:${this.config.port}`;

        this.s3Client = new S3({
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
            endpoint: this.s3Endpoint,
            sslEnabled: this.config.sslEnabled,
            region: this.config.region,
            apiVersion: "2006-03-01",
            s3ForcePathStyle: true,
            maxRetries: 5,
            params: {
                Bucket: this.config.bucket
            }
        });
    }

    async writeFile(filePath: string, fileContent: IFileContent, fileContentType: string, options: IWriteFileOptions = null): Promise<IFileInfo> {
        if (_.isNil(options)) {
            options = DEFAULT_WRITE_FILE_OPTIONS;
        } else {
            options = _.defaults(options, DEFAULT_WRITE_FILE_OPTIONS);
        }

        let content: IFileContent = fileContent;
        if (options.fileContentAsLocalPath) {
            content = fs.createReadStream(<string>fileContent, { encoding: options.encoding });
        }

        filePath = _.trimStart(filePath, "/");

        if (!options.overwrite) {
            try {
                if (await this.fileExists(filePath)) {
                    throw new Error("File already exists");
                }
            } catch (err) {
                logger.error({ err, filePath, fileContentType, options }, "S3FileStorageService.writeFile: failed to check whether file exists in S3");

                throw err;
            }
        }

        let uploadResult: S3.ManagedUpload.SendData = null;
        try {
            const op = this.s3Client.upload({
                Key: filePath,
                Body: content,
                Bucket: this.config.bucket,
                ContentType: fileContentType
            }).promise();

            if (options.awaitOperation) {
                uploadResult = await op;
            }
        } catch (err) {
            logger.error({ err, filePath, fileContentType, options }, "S3FileStorageService.writeFile: failed to upload file to S3");

            // Rethrow only if we're awaiting operation, will be uncaught exception otherwise
            if (options.awaitOperation) {
                throw err;
            }

            return;
        }

        return {
            name: _.last(filePath.split("/")),
            filePath: filePath,
            publicUrl: _.isNil(uploadResult) ? this.getPublicUrl(filePath) : uploadResult.Location
        };
    }

    async readFile(fileInfo: IFileInfo, options?: IReadFileOptions): Promise<Buffer>;
    async readFile(filePath: string, options?: IReadFileOptions): Promise<Buffer>;
    async readFile(...args: any[]): Promise<Buffer> {
        if (_.isEmpty(args)) {
            throw new Error("Missing arguments");
        }

        let filePath: string;
        if (_.isString(args[0])) {
            filePath = args[0];
        } else if (_.isObject(args[0])) {
            filePath = (<IFileInfo>args[0]).filePath;
        } else {
            throw new Error("Missing arguments");
        }

        filePath = _.trimStart(filePath, "/");

        let options: IReadFileOptions;
        if (args.length >= 2 && !_.isNil(args[1])) {
            options = _.defaults(args[1], DEFAULT_READ_FILE_OPTIONS);
        } else {
            options = DEFAULT_READ_FILE_OPTIONS;
        }

        try {
            const op = await this.s3Client.getObject({
                Key: filePath,
                Bucket: this.config.bucket
            }).promise();

            return <Buffer>op.Body;
        } catch (err) {
            if (err.code === "NoSuchKey" && options.ignoreMissing) {
                return null;
            }

            logger.error({ err, filePath, options }, "S3FileStorageService.readFile: failed to read file from S3");

            throw err;
        }
    }

    async deleteFile(fileInfo: IFileInfo, options?: IDeleteFileOptions): Promise<void>;
    async deleteFile(filePath: string, options?: IDeleteFileOptions): Promise<void>;
    async deleteFile(...args: any[]): Promise<void> {
        if (_.isEmpty(args)) {
            throw new Error("Missing arguments");
        }

        let filePath: string;
        if (_.isString(args[0])) {
            filePath = args[0];
        } else if (_.isObject(args[0])) {
            filePath = (<IFileInfo>args[0]).filePath;
        } else {
            throw new Error("Missing arguments");
        }

        filePath = _.trimStart(filePath, "/");

        let options: IDeleteFileOptions;
        if (args.length >= 2 && !_.isNil(args[1])) {
            options = _.defaults(args[1], DEFAULT_DELETE_FILE_OPTIONS);
        } else {
            options = DEFAULT_DELETE_FILE_OPTIONS;
        }

        try {
            // S3 does not return an error if we try to delete the same/non-existing object multiple times, delete operation will thus always succeed
            const op = this.s3Client.deleteObject({
                Key: filePath,
                Bucket: this.config.bucket
            }).promise();

            if (options.awaitOperation) {
                await op;
            }
        } catch (err) {
            logger.error({ err, filePath, options }, "S3FileStorageService.deleteFile: failed to delete file from S3");

            // Rethrow only if we're awaiting operation, will be uncaught exception otherwise
            if (options.awaitOperation) {
                throw err;
            }
        }
    }

    async deleteFiles(fileInfos: IFileInfo[], options?: IDeleteFileOptions): Promise<void>;
    async deleteFiles(filePaths: string[], options?: IDeleteFileOptions): Promise<void>;
    async deleteFiles(...args: any[]): Promise<void> {
        if (_.isEmpty(args)) {
            throw new Error("Missing arguments");
        }

        let filePaths: string[];

        const isFilePaths = _.some(args[0], _.isString);
        const isFileInfos = _.some(args[0], _.isObject);
        if (isFilePaths) {
            filePaths = args[0];
        } else if (isFileInfos) {
            filePaths = (<IFileInfo[]>args[0]).map((fileInfo: IFileInfo) => fileInfo.filePath);
        } else {
            throw new Error("Missing arguments");
        }

        filePaths = filePaths.map((filePath) => _.trimStart(filePath, "/"));

        let options: IDeleteFileOptions;
        if (args.length >= 2 && !_.isNil(args[1])) {
            options = _.defaults(args[1], DEFAULT_DELETE_FILE_OPTIONS);
        } else {
            options = DEFAULT_DELETE_FILE_OPTIONS;
        }

        try {
            // S3 does not return an error if we try to delete the same/non-existing object multiple times, delete operation will thus always succeed
            const op = this.s3Client.deleteObjects({
                Delete: {
                    Objects: filePaths.map((filePath) => { return { Key: filePath }; })
                },
                Bucket: this.config.bucket
            }).promise();

            if (options.awaitOperation) {
                const res = await op;

                if (!_.isEmpty(res.Errors)) {
                    _.each(res.Errors, (err) => {
                        logger.error({ err, filePaths, options }, "S3FileStorageService.deleteFiles: failed to delete file from S3");
                    });

                    // Rethrow only if we're awaiting operation, will be uncaught exception otherwise
                    if (options.awaitOperation) {
                        // Throw S3-generated error if we only have one, generic one otherwise
                        if (res.Errors.length === 1) {
                            throw res.Errors[0];
                        }

                        throw new Error("Failed to delete files from S3");
                    }
                }
            }
        } catch (err) {
            logger.error({ err, filePaths, options }, "S3FileStorageService.deleteFiles: failed to delete files from S3");

            // Rethrow only if we're awaiting operation, will be uncaught exception otherwise
            if (options.awaitOperation) {
                throw err;
            }
        }
    }

    async fileExists(fileInfo: IFileInfo): Promise<boolean>;
    async fileExists(filePath: string): Promise<boolean>;
    async fileExists(...args: any[]): Promise<boolean> {
        if (_.isEmpty(args)) {
            throw new Error("Missing arguments");
        }

        let filePath: string;
        if (_.isString(args[0])) {
            filePath = args[0];
        } else if (_.isObject(args[0])) {
            filePath = (<IFileInfo>args[0]).filePath;
        } else {
            throw new Error("Missing arguments");
        }

        filePath = _.trimStart(filePath, "/");

        try {
            await this.s3Client.headObject({
                Key: filePath,
                Bucket: this.config.bucket
            }).promise();

            return true;
        } catch (err) {
            if (err.code !== "NotFound") {
                logger.error({ err, filePath }, "S3FileStorageService.fileExists: failed to check if file exists in S3");
            }
        }

        return false;
    }

    async fileInfo(fileInfo: IFileInfo): Promise<IFileInfo>;
    async fileInfo(filePath: string): Promise<IFileInfo>;
    async fileInfo(...args: any[]): Promise<IFileInfo> {
        if (_.isEmpty(args)) {
            throw new Error("Missing arguments");
        }

        let filePath: string;
        if (_.isString(args[0])) {
            filePath = args[0];
        } else if (_.isObject(args[0])) {
            filePath = (<IFileInfo>args[0]).filePath;
        } else {
            throw new Error("Missing arguments");
        }

        filePath = _.trimStart(filePath, "/");

        if (!await this.fileExists(filePath)) {
            return null;
        }

        return {
            name: _.last(filePath.split("/")),
            filePath: filePath,
            publicUrl: this.getPublicUrl(filePath)
        };
    }

    async listFiles(directory: string): Promise<IFileInfo[]> {
        directory = _.trimStart(directory, "/");

        try {
            // S3 does not return an error if we try to list files in non-existing directory, list operation will thus always succeed
            const op = await this.s3Client.listObjectsV2({
                Prefix: directory,
                Bucket: this.config.bucket
            }).promise();

            return op.Contents.map((s3object) => {
                return {
                    name: _.last(s3object.Key.split("/")),
                    filePath: s3object.Key,
                    publicUrl: this.getPublicUrl(s3object.Key)
                };
            });
        } catch (err) {
            logger.error({ err, directory }, "S3FileStorageService.listFiles: failed to list files in S3");
        }

        return [];
    }

    async isAccessible(rethrow: boolean = false): Promise<boolean> {
        try {
            await this.s3Client.headBucket({
                Bucket: this.config.bucket
            }).promise();

            return true;
        } catch (err) {
            logger.error({ err }, "S3FileStorageService.isAccessible: received error while checking bucket access");

            if (rethrow) {
                throw err;
            }
        }

        return false;
    }

    private getPublicUrl(filePath: string): string {
        filePath = _.trimStart(filePath, "/");

        return urlJoin(this.s3Endpoint, this.config.bucket, filePath);
    }
}

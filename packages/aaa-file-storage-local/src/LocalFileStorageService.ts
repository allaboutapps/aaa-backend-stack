import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as urlJoin from "url-join";

import { FS_EXTRA } from "@aaa-backend-stack/build-tools";
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

export interface ILocalFileStorageServiceConfig {
    baseDirectory: string;
    publicBaseUrl: string;
}

export class LocalFileStorageService implements IFileStorageService {
    private config: ILocalFileStorageServiceConfig;

    constructor(config: ILocalFileStorageServiceConfig) {
        this.config = config;

        if (_.isEmpty(this.config.baseDirectory)) {
            throw new Error("Missing base directory for local file storage");
        }
        if (_.isEmpty(this.config.publicBaseUrl)) {
            throw new Error("Missing public base URL for local file storage");
        }
    }

    async writeFile(filePath: string, fileContent: IFileContent, fileContentType: string, options: IWriteFileOptions = null): Promise<IFileInfo> {
        if (_.isNil(options)) {
            options = DEFAULT_WRITE_FILE_OPTIONS;
        } else {
            options = _.defaults(options, DEFAULT_WRITE_FILE_OPTIONS);
        }

        let content: IFileContent = fileContent;
        if (options.fileContentAsLocalPath) {
            content = await FS_EXTRA.readFile(<string>fileContent, options.encoding);
        }

        if (this.isReadStream(fileContent)) {
            content = await new Promise<string>((resolve, reject) => {
                const stream = fileContent as fs.ReadStream;
                let tmpContent: string = "";

                stream.setEncoding(options.encoding);

                stream.on("data", (chunk) => {
                    tmpContent += chunk;
                });

                stream.on("end", () => {
                    resolve(tmpContent);
                });

                stream.on("error", (err) => {
                    reject(err);
                });
            });
        }

        const fullFilePath = this.getFullFilePath(filePath);
        const fullDirectoryPath = path.dirname(fullFilePath);

        try {
            await FS_EXTRA.ensureDir(fullDirectoryPath);
        } catch (err) {
            logger.error({ err, fullDirectoryPath }, "LocalFileStorageService.writeFile: failed to ensure full directory path exists");

            throw new Error("Failed to create directory");
        }

        if (!options.overwrite) {
            try {
                if (await this.fileExists(filePath)) {
                    throw new Error("File already exists");
                }
            } catch (err) {
                logger.error({ err, filePath, fileContentType, options }, "LocalFileStorageService.writeFile: failed to check whether file exists in local file system");

                throw err;
            }
        }

        try {
            const op = FS_EXTRA.writeFile(fullFilePath, content, { encoding: options.encoding });

            if (options.awaitOperation) {
                await op;
            }
        } catch (err) {
            logger.error({ err, fullFilePath, fileContentType, options }, "LocalFileStorageService.writeFile: failed to write file to local file system");

            // Rethrow only if we're awaiting operation, will be uncaught exception otherwise
            if (options.awaitOperation) {
                throw err;
            }

            return;
        }

        return {
            name: _.last(filePath.split("/")),
            filePath: filePath,
            publicUrl: this.getPublicUrl(filePath)
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

        let options: IReadFileOptions;
        if (args.length >= 2 && !_.isNil(args[1])) {
            options = _.defaults(args[1], DEFAULT_READ_FILE_OPTIONS);
        } else {
            options = DEFAULT_READ_FILE_OPTIONS;
        }

        const fullFilePath = this.getFullFilePath(filePath);

        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(fullFilePath, (err, data) => {
                if (!_.isNil(err)) {
                    if (err.code === "ENOENT" && options.ignoreMissing) {
                        resolve(null);

                        return;
                    }

                    logger.error({ err, fullFilePath, options }, "LocalFileStorageService.readFile: failed to read file from local file system");

                    reject(err);

                    return;
                }

                resolve(data);
            });
        });
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

        let options: IDeleteFileOptions;
        if (args.length >= 2 && !_.isNil(args[1])) {
            options = _.defaults(args[1], DEFAULT_DELETE_FILE_OPTIONS);
        } else {
            options = DEFAULT_DELETE_FILE_OPTIONS;
        }

        const fullFilePath = this.getFullFilePath(filePath);

        try {
            const op = FS_EXTRA.unlink(fullFilePath);

            if (options.awaitOperation) {
                await op;
            }
        } catch (err) {
            if (err.code === "ENOENT" && options.ignoreMissing) {
                return;
            }

            logger.error({ err, fullFilePath, options }, "LocalFileStorageService.deleteFile: failed to delete file from local file system");

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
            filePaths = (<IFileInfo[]>args[0]).map((fi: IFileInfo) => fi.filePath);
        } else {
            throw new Error("Missing arguments");
        }

        let options: IDeleteFileOptions;
        if (args.length >= 2 && !_.isNil(args[1])) {
            options = _.defaults(args[1], DEFAULT_DELETE_FILE_OPTIONS);
        } else {
            options = DEFAULT_DELETE_FILE_OPTIONS;
        }

        try {
            const op = Promise.map(filePaths, async (filePath) => {
                try {
                    await this.deleteFile(filePath, options);
                } catch (err) {
                    logger.error({ err, filePath, options }, "LocalFileStorageService.deleteFiles: failed to delete files from local file system");
                }
            });

            if (options.awaitOperation) {
                await op;
            }
        } catch (err) {
            logger.error({ err, options }, "LocalFileStorageService.deleteFiles: failed to delete files from local file system");

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

        const fullFilePath = this.getFullFilePath(filePath);

        try {
            const fileStats = await FS_EXTRA.stat(fullFilePath);

            return fileStats.isFile();
        } catch (err) {
            if (err.code !== "ENOENT") {
                logger.error({ err, fullFilePath }, "LocalFileStorageService.fileExists: failed to check if file exists in local file system");
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
        const fullDirectoryPath = path.resolve(this.config.baseDirectory, directory);

        try {
            const files = await FS_EXTRA.readdir(fullDirectoryPath);

            return files.map((file) => {
                return {
                    name: file,
                    filePath: path.join(fullDirectoryPath, file),
                    publicUrl: this.getPublicUrl(path.join(directory, file))
                };
            });
        } catch (err) {
            logger.error({ err, fullDirectoryPath }, "LocalFileStorageService.listFiles: failed to list files in local file system");
        }

        return [];
    }

    async isAccessible(rethrow: boolean = false): Promise<boolean> {
        try {
            await FS_EXTRA.access(this.config.baseDirectory, fs.constants.W_OK);

            return true;
        } catch (err) {
            logger.error({ err }, "LocalFileStorageService.isAccessible: received error while checking base directory access");

            if (rethrow) {
                throw err;
            }
        }

        return false;
    }

    private getFullFilePath(filePath: string): string {
        return path.resolve(path.join(this.config.baseDirectory, filePath));
    }

    private getPublicUrl(filePath: string): string {
        return urlJoin(this.config.publicBaseUrl, filePath);
    }

    private isReadStream(content: any): boolean {
        return content !== null &&
            typeof content === "object" &&
            typeof content.pipe === "function" &&
            content.readable !== false &&
            typeof content._read === "function" &&
            typeof content._readableState === "object";
    }
}

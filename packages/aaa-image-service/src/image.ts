import * as fs from "fs";
import * as gm from "gm";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";

import { FS_EXTRA } from "@aaa-backend-stack/build-tools";
import { IFileStorageService, IFileInfo } from "@aaa-backend-stack/file-storage";
import { getChildLogger } from "@aaa-backend-stack/logger";
import * as REST from "@aaa-backend-stack/rest";
import { UUID } from "@aaa-backend-stack/storage";

const logger = getChildLogger("@aaa-backend-stack/image-service");

import { UNSUPPORTED_MEDIA_TYPE_INVALID_IMAGE_FORMAT } from "./_errors";
import { IImageUploadResult, IParsedMultipartPayload, IImageServiceConfig } from "./_types";

const IMAGE_SERVICE_DEFAULT_CONFIG: IImageServiceConfig = {
    allowedFormats: ["jpeg", "png"],
    defaultPath: "/uploads/images/default",
    paths: {},
    imageSize: {
        height: 1024,
        width: 1024
    },
    thumbnailSize: {
        height: 512,
        width: 512
    }
};

export class ImageService {
    private config: IImageServiceConfig;
    private isTestEnv: boolean;
    private fileStorage: IFileStorageService;
    private tmpdir: string;

    constructor() {
        this.config = IMAGE_SERVICE_DEFAULT_CONFIG;

        this.isTestEnv = process.env.NODE_ENV === "test";

        this.tmpdir = os.tmpdir();
    }

    configure(config: Partial<IImageServiceConfig>): void {
        this.config = _.defaultsDeep(config, IMAGE_SERVICE_DEFAULT_CONFIG);

        // File storage must be explicitly set by consuming application
        this.fileStorage = null;
    }

    setFileStorageService(fileStorageService: IFileStorageService): void {
        this.fileStorage = fileStorageService;
    }

    async processMultipartPayload(payload: any, imageType: string, createThumbnail: boolean = true): Promise<IParsedMultipartPayload> {
        if (_.isNil(this.fileStorage)) {
            throw new Error("File storage not configured");
        }

        const multipartContents = await REST.UTILS.extractMultipartPayload(payload);
        const files = REST.UTILS.extractFilesFromMultipartUpload(multipartContents);

        logger.debug({ files }, "ImageService.processMultipartPayload: processing uploaded files");

        let imageUploadResults: IImageUploadResult[];
        try {
            imageUploadResults = await Promise.map(files, async (file) => this.processImageUpload(file, imageType, createThumbnail));
        } catch (err) {
            // Cleanup uploaded files and rethrow error
            await Promise.map(files, async (fileName) => {
                fs.unlink(fileName, (err) => {
                    if (!_.isNil(err)) {
                        // Ignore "file not found" errors, might have already been cleaned up by previous steps
                        if (err.code === "ENOENT") {
                            return;
                        }

                        logger.warn({ err, fileName }, "ImageService.processMultipartPayload: failed to unlink file during failed upload cleanup");

                        return;
                    }

                    logger.debug({ fileName }, "ImageService.processImageUpload: successfully unlinked file during failed upload cleanup");
                });
            });

            throw err;
        }

        logger.debug({ imageCount: imageUploadResults.length }, "ImageService.processMultipartPayload: finished processing uploaded files");

        return {
            fields: multipartContents.fields,
            images: imageUploadResults
        };
    }

    async processImageUpload(fileName: string, imageType: string, createThumbnail: boolean = true): Promise<IImageUploadResult> {
        if (_.isNil(this.fileStorage)) {
            throw new Error("File storage not configured");
        }

        logger.debug({ fileName }, "ImageService.processImageUpload: processing image upload");

        const image = gm(fileName);
        const imageFormat = (await this.getImageFormat(image)).toLowerCase();
        if (!_.includes(this.config.allowedFormats, imageFormat)) {
            fs.unlink(fileName, (err) => {
                if (!_.isNil(err)) {
                    logger.warn({ err, fileName, imageFormat }, "ImageService.processImageUpload: failed to unlink file with unsupported format");

                    return;
                }

                logger.debug({ fileName, imageFormat }, "ImageService.processImageUpload: successfully unlinked file with unsupported format");
            });

            throw REST.BASE.createBoom(UNSUPPORTED_MEDIA_TYPE_INVALID_IMAGE_FORMAT);
        }

        logger.debug({ fileName, imageFormat }, "ImageService.processImageUpload: verified image format");

        const imageUid = UUID.v4();
        const imageFileName = `${imageUid}.${imageFormat}`;
        const imageFilePath = this.getFullImageFilePath(imageType, imageFileName);
        const fullImageFilePath = path.join(this.tmpdir, imageFilePath);

        logger.debug({ fileName, imageUid, imageFilePath }, "ImageService.processImageUpload: resizing image and writing to OS tmpdir");

        const imageFileInfo = await this.writeImage(image.resize(this.config.imageSize.width, this.config.imageSize.height), imageFilePath, fullImageFilePath, imageFormat);

        let thumbnailFilePath: string = null;
        let thumbnailFileInfo: IFileInfo = null;
        if (createThumbnail) {
            const thumbnailFileName = `${imageUid}.${this.config.thumbnailSize.width}x${this.config.thumbnailSize.height}.${imageFormat}`;
            thumbnailFilePath = this.getFullImageFilePath(imageType, thumbnailFileName);
            const fullThumbnailFilePath = path.join(this.tmpdir, thumbnailFilePath);

            logger.debug({ fileName, imageUid, thumbnailFilePath }, "ImageService.processImageUpload: creating thumbnail and writing to OS tmpdir");

            thumbnailFileInfo = await this.writeThumbnail(image, thumbnailFilePath, fullThumbnailFilePath, imageFormat);
        }

        fs.unlink(fileName, (err) => {
            if (!_.isNil(err)) {
                logger.warn({ err, fileName, imageFormat }, "ImageService.processImageUpload: failed to unlink uploaded file from temp folder");

                return;
            }

            logger.debug({ fileName, imageFormat }, "ImageService.processImageUpload: successfully unlinked uploaded file from temp folder");
        });

        logger.debug({ fileName, imageUid, imageFilePath, thumbnailFilePath }, "ImageService.processImageUpload: successfully processed image upload");

        return {
            fileName,
            imageUid,
            imageFileInfo,
            thumbnailFileInfo
        };
    }

    async cleanupImageUploads(imageUploadResults: IImageUploadResult[]): Promise<void> {
        if (_.isNil(this.fileStorage)) {
            throw new Error("File storage not configured");
        }

        await Promise.map(imageUploadResults, async (result) => {
            try {
                await this.deleteImageFromFileStorage(result.imageFileInfo.filePath);
            } catch (err) {
                logger.warn({ err, result }, "ImageService.cleanupImageUploads: failed to clean up image");
            }

            if (!_.isNil(result.thumbnailFileInfo)) {
                try {
                    await this.deleteImageFromFileStorage(result.thumbnailFileInfo.filePath);
                } catch (err) {
                    logger.warn({ err, result }, "ImageService.cleanupImageUploads: failed to clean up thumbnail image");
                }
            }
        });
    }

    async deleteImageFromFileStorage(filePath: string): Promise<void> {
        if (_.isNil(this.fileStorage)) {
            throw new Error("File storage not configured");
        }

        return this.fileStorage.deleteFile(filePath);
    }

    private async getImageFormat(imageOrFilePath: gm.State | string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let image: gm.State;
            if (_.isString(imageOrFilePath)) {
                image = gm(imageOrFilePath);
            } else {
                image = imageOrFilePath;
            }

            image.format((err, format) => {
                if (!_.isNil(err)) {
                    reject(err);

                    return;
                }

                resolve(format);
            });
        });
    }

    private async writeImage(image: gm.State, imageFilePath: string, fullImageFilePath: string, imageFormat: string): Promise<IFileInfo> {
        if (_.isNil(this.fileStorage)) {
            throw new Error("File storage not configured");
        }

        await FS_EXTRA.ensureDir(path.dirname(fullImageFilePath));

        return new Promise<IFileInfo>((resolve, reject) => {
            image.write(fullImageFilePath, (err) => {
                if (!_.isNil(err)) {
                    reject(err);

                    return;
                }

                resolve();
            });
        }).then(async () => {
            return this.fileStorage.writeFile(imageFilePath, fullImageFilePath, `image/${imageFormat}`, { fileContentAsLocalPath: true });
        }).then((fileInfo) => {
            return new Promise<IFileInfo>((resolve, reject) => {
                fs.unlink(fullImageFilePath, (err) => {
                    if (!_.isNil(err)) {
                        logger.warn({ err, fileInfo, fullImageFilePath }, "ImageService.writeImage: failed to clean up image from tmpdir, ignoring");
                    }

                    resolve(fileInfo);
                });
            });
        });
    }

    private async writeThumbnail(image: gm.State, thumbnailFilePath: string, fullThumbnailFilePath: string, imageFormat: string): Promise<IFileInfo> {
        if (_.isNil(this.fileStorage)) {
            throw new Error("File storage not configured");
        }

        await FS_EXTRA.ensureDir(path.dirname(fullThumbnailFilePath));

        return new Promise<IFileInfo>((resolve, reject) => {
            image.thumb(this.config.thumbnailSize.width, this.config.thumbnailSize.height, fullThumbnailFilePath, (err) => {
                if (!_.isNil(err)) {
                    reject(err);

                    return;
                }

                resolve();
            });
        }).then(async () => {
            return this.fileStorage.writeFile(thumbnailFilePath, fullThumbnailFilePath, `image/${imageFormat}`, { fileContentAsLocalPath: true });
        }).then((fileInfo) => {
            return new Promise<IFileInfo>((resolve, reject) => {
                fs.unlink(fullThumbnailFilePath, (err) => {
                    if (!_.isNil(err)) {
                        logger.warn({ err, fileInfo, fullThumbnailFilePath }, "ImageService.writeThumbnail: failed to clean up thumbnail from tmpdir, ignoring");
                    }

                    resolve(fileInfo);
                });
            });
        });
    }

    private getFullImageFilePath(imageType: string, fileName: string): string {
        return _.isEmpty(this.config.paths[imageType]) ?
            path.join(this.config.defaultPath, this.isTestEnv ? "test" : "", fileName) :
            path.join(this.config.paths[imageType], this.isTestEnv ? "test" : "", fileName);
    }
}

export const instance = new ImageService();

export default instance;

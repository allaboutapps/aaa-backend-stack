import { IFileInfo } from "@aaa-backend-stack/file-storage";

export interface IImageServicePathConfig {
    [imageType: string]: string;
}

export interface IImageServiceSizeConfig {
    height: number;
    width: number;
}

export interface IImageServiceConfig {
    allowedFormats: string[];
    defaultPath: string;
    paths: IImageServicePathConfig;
    imageSize: IImageServiceSizeConfig;
    thumbnailSize: IImageServiceSizeConfig;
}

export interface IImageUploadResult {
    fileName: string;
    imageUid: string;
    imageFileInfo: IFileInfo;
    thumbnailFileInfo?: IFileInfo;
}

export interface IParsedMultipartPayload {
    images: IImageUploadResult[];
    fields: any;
}

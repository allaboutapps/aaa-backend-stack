import * as fs from "fs";

import { IDeleteFileOptions, IReadFileOptions, IWriteFileOptions } from "./options";

export interface IFileInfo {
    name: string;
    filePath: string;
    publicUrl: string;
}

export type IFileContent = string | Buffer | Uint8Array | fs.ReadStream;

export interface IFileStorageService {
    writeFile(filePath: string, fileContent: IFileContent, fileContentType: string, options?: IWriteFileOptions): Promise<IFileInfo>;

    readFile(fileInfo: IFileInfo, options?: IReadFileOptions): Promise<Buffer>;
    readFile(filePath: string, options?: IReadFileOptions): Promise<Buffer>;

    deleteFile(fileInfo: IFileInfo, options?: IDeleteFileOptions): Promise<void>;
    deleteFile(filePath: string, options?: IDeleteFileOptions): Promise<void>;

    deleteFiles(fileInfos: IFileInfo[], options?: IDeleteFileOptions): Promise<void>;
    deleteFiles(filePaths: string[], options?: IDeleteFileOptions): Promise<void>;

    fileExists(fileInfo: IFileInfo): Promise<boolean>;
    fileExists(filePath: string): Promise<boolean>;

    fileInfo(fileInfo: IFileInfo): Promise<IFileInfo>;
    fileInfo(filePath: string): Promise<IFileInfo>;

    listFiles(directory: string): Promise<IFileInfo[]>;

    isAccessible(rethrow?: boolean): Promise<boolean>;
}

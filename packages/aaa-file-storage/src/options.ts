export interface IReadFileOptions {
    encoding?: string | null;
    ignoreMissing?: boolean;
}

export const DEFAULT_READ_FILE_OPTIONS: IReadFileOptions = {
    encoding: null,
    ignoreMissing: false
};

export interface IWriteFileOptions {
    awaitOperation?: boolean;
    encoding?: string | null;
    fileContentAsLocalPath?: boolean;
    overwrite?: boolean;
}

export const DEFAULT_WRITE_FILE_OPTIONS: IWriteFileOptions = {
    awaitOperation: true,
    encoding: null,
    fileContentAsLocalPath: false,
    overwrite: false,
};

export interface IDeleteFileOptions {
    awaitOperation?: boolean;
    ignoreMissing?: boolean;
}

export const DEFAULT_DELETE_FILE_OPTIONS: IDeleteFileOptions = {
    awaitOperation: true,
    ignoreMissing: false
};

import * as tmpWrite from "temp-write";
import * as fs from "fs";
import { FS_EXTRA } from "@aaa-backend-stack/build-tools";

// https://nodejs.org/api/fs.html#fs_fs_fsyncsync_fd
const fsFsync: (fd: number) => Promise<undefined> = Promise.promisify(fs.fsync) as any;

// https://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback
const fsOpen: (filename: string, flags: string, mode?: number) => Promise<number> = Promise.promisify(fs.open) as any;

// https://nodejs.org/api/fs.html#fs_fs_close_fd_callback
const fsClose: (fd: number) => Promise<undefined> = Promise.promisify(fs.close) as any;

// write an 5MB file to os tmp dir by default
const DEFAULT_TMP_BUFFER_SIZE_BYTES = 1024 * 1024 * 5;

// writes a zero filled buffer to tmp file and flushes to disk and removes it again.
// thus checks if tmp directory is currently writable (not readonly or out of space).
export async function checkFSTmpWriteable(bufferSizeInBytes: number = DEFAULT_TMP_BUFFER_SIZE_BYTES): Promise<true> {

    // attention, never use new Buffer (unsafe), we want a zero filled one through alloc
    // see https://nodejs.org/api/buffer.html#buffer_buffer_from_buffer_alloc_and_buffer_allocunsafe
    const buf = Buffer.alloc(bufferSizeInBytes);

    // write the tmp file...
    const tmpFile = await tmpWrite(buf);

    try {
        // get the file descriptor...
        const fd = await fsOpen(tmpFile, "r");

        // force hard disk flush.
        await fsFsync(fd);

        // close the file descriptor...
        await fsClose(fd);
    } catch (e) {

        // even on errors, try to remove the file again!
        // this way our filesystem won't be spammed 
        await FS_EXTRA.remove(tmpFile);

        // finally rethrow the fd error
        throw e;
    }

    // success fs, delete the tmp file...
    await FS_EXTRA.remove(tmpFile);

    return true;
}


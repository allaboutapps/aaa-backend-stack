import * as multiparty from "multiparty";

export interface IExtractedMultipartPayload {
    files: any;
    fields: any;
}

export function extractMultipartPayload(payload, options: multiparty.FormOptions = {}): Promise<IExtractedMultipartPayload> {
    return <Promise<IExtractedMultipartPayload>>new Promise(function (resolve, reject) {
        const form = new multiparty.Form(options);
        form.parse(payload, (err, fields, files) => {
            // On Error
            if (err) {
                return reject(err);
            }

            // On Success
            return resolve({
                files: files,
                fields: fields
            });
        });
    });
}

export function extractFilesFromMultipartUpload(multipartContents: any): string[] {
    let files = [];
    for (let fileKey in multipartContents.files) {
        if (multipartContents.files.hasOwnProperty(fileKey)) {
            for (let fileContents of multipartContents.files[fileKey]) {
                // console.log("-", fileContents);
                files.push(fileContents.path);
            }
        }
    }
    return files;
}

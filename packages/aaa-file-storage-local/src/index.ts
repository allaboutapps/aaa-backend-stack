export * from "./LocalFileStorageService";

import { LocalFileStorageService } from "./LocalFileStorageService";
export default LocalFileStorageService;

// Defines which dependencies this package owns (and thus these should not be required by the actual service)
// Thus this package must ensure the proper functioning of the external dep within the whole stack
export const __OWNS__ = [];

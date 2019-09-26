import { StorageAdapter } from "./adapters/StorageAdapter";

// no generic is passed here, instead augment the models type directly from the application service.
const storage: StorageAdapter<any> = new StorageAdapter();
export default storage;

import { BoomError } from "boom";

export type BoomErrorFn = () => BoomError;

export interface IStatusCodeDefinition {
    code: number;
    message: string;
    errorType?: string;
}

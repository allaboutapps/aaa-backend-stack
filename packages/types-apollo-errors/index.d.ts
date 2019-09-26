declare module "apollo-errors" {
    export interface IApolloError extends Error {
        time_thrown: string;
        data: Object;
    }

    export type IApolloErrorConstructor = new (data?: object) => IApolloError;

    const createError: (name: string, options: {
        message: string;
        data?: object;
        options?: object;
    }) => IApolloErrorConstructor;

    const isInstance: (error: Error | undefined) => boolean;

    const formatError: (error: Error, strict?: boolean) => IApolloError | Error | null;
}

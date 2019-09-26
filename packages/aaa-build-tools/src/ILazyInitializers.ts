export type ILazyConfig<TInitializeConfig> = TInitializeConfig & {
    configure: (options: TInitializeConfig) => TInitializeConfig;
};

export interface ILazySingletonInitializer<TInitializeConfig> {
    CONFIG: TInitializeConfig;
    configure: (options: TInitializeConfig) => TInitializeConfig;
}

export interface IReconfigurableSingletonInitializer<TInitializeConfig> extends ILazySingletonInitializer<TInitializeConfig> {
    reconfigure: (options: TInitializeConfig | any) => any;
}

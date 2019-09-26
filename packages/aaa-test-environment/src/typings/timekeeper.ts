declare module "timekeeper" {

    const travel: (date: Date) => void;
    const reset: () => void;
    const freeze: (date: Date) => void;
    const isKeepingTime: () => boolean;

}

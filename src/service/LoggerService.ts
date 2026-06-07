export class LoggerService {
    public static debug(content: string): void {
        console.debug(`debug:  ${content}`);
    }

    public static info(content: string): void {
        console.info(`info:  ${content}`);
    }

    public static warn(content: string): void {
        console.warn(`warn:  ${content}`);
    }

    public static error(content: string): void {
        console.error(`error:  ${content}`);
    }
}

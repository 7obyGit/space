import { singleton } from "tsyringe";

@singleton()
export class LoggerService {
    public debug(content: string): void {
        console.debug(`debug:  ${content}`);
    }

    public info(content: string): void {
        console.info(`info:  ${content}`);
    }

    public warn(content: string): void {
        console.warn(`warn:  ${content}`);
    }

    public error(content: string): void {
        console.error(`error:  ${content}`);
    }
}

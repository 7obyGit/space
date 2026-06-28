import { singleton } from "tsyringe";

@singleton()
export class LoggerService {
    public log(level: string, content: any): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] ${level}:  ${JSON.stringify(content, null, 2)}`;
    }

    public debug(content: any): void {
        // tslint:disable-next-line:no-console
        console.debug(this.log("debug", content));
    }

    public info(content: any): void {
        // tslint:disable-next-line:no-console
        console.info(this.log("info", content));
    }

    public warn(content: any): void {
        // tslint:disable-next-line:no-console
        console.warn(this.log("warn", content));
    }

    public error(content: any): void {
        // tslint:disable-next-line:no-console
        console.error(this.log("error", content));
    }
}

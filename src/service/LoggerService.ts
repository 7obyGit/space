import chalk from "chalk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { singleton } from "tsyringe";

@singleton()
export class LoggerService {
    constructor() {
        marked.setOptions({
            renderer: new TerminalRenderer({
                tableOptions: {
                    style: {
                        head: ["yellow", "bold"],
                    },
                },
            }) as any,
        });
    }

    private render(text: string): string {
        return (marked(text) as string)
            .trim()
            .replace(/^\u001b\[0m/, "")
            .replace(/\u001b\[0m$/, "");
    }

    private formatMessage(
        level: string,
        content: any,
        colorFn: (text: string) => string,
    ): string {
        const timestamp = new Date().toISOString();
        const jsonContent = JSON.stringify(content, null, 2);
        const header = colorFn(`[${timestamp}] ${level}:`);
        const markdown = `\`\`\`json\n${jsonContent}\n\`\`\``;
        return `${header}\n${this.render(markdown)}`;
    }

    public log(content: string): void {
        // tslint:disable-next-line:no-console
        console.log(content);
    }

    public debug(content: any): void {
        const message =
            typeof content === "string"
                ? this.render(content)
                : this.formatMessage("DEBUG", content, chalk.blue);
        // tslint:disable-next-line:no-console
        console.debug(message);
    }

    public info(content: any): void {
        const message =
            typeof content === "string"
                ? this.render(content)
                : this.formatMessage("INFO", content, chalk.cyan);
        // tslint:disable-next-line:no-console
        console.info(message);
    }

    public warn(content: any): void {
        const message =
            typeof content === "string"
                ? this.render(content)
                : this.formatMessage("WARN", content, chalk.yellow);
        // tslint:disable-next-line:no-console
        console.warn(message);
    }

    public error(content: any): void {
        const message =
            typeof content === "string"
                ? this.render(content)
                : this.formatMessage("ERROR", content, chalk.red.bold);
        // tslint:disable-next-line:no-console
        console.error(message);
    }
}

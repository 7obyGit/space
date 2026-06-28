import { singleton } from "tsyringe";
import chalk from "chalk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

@singleton()
export class LoggerService {
    constructor() {
        marked.setOptions({
            renderer: new TerminalRenderer() as any,
        });
    }

    private render(text: string): string {
        // Check if the string already contains ANSI escape codes
        const hasAnsi = /\u001b\[[0-9;]*m/.test(text);
        if (hasAnsi) {
            return text;
        }
        return (marked(text) as string).trim();
    }

    private formatMessage(level: string, content: any, colorFn: (text: string) => string): string {
        const timestamp = new Date().toISOString();
        const jsonContent = JSON.stringify(content, null, 2);
        const header = colorFn(`[${timestamp}] ${level}:`);
        const markdown = `\`\`\`json\n${jsonContent}\n\`\`\``;
        return `${header}\n${this.render(markdown)}`;
    }

    public debug(content: any): void {
        // tslint:disable-next-line:no-console
        console.debug(typeof content === "string" ? this.render(content) : this.formatMessage("DEBUG", content, chalk.blue));
    }

    public info(content: any): void {
        // tslint:disable-next-line:no-console
        console.info(typeof content === "string" ? this.render(content) : this.formatMessage("INFO", content, chalk.cyan));
    }

    public warn(content: any): void {
        // tslint:disable-next-line:no-console
        console.warn(typeof content === "string" ? this.render(content) : this.formatMessage("WARN", content, chalk.yellow));
    }

    public error(content: any): void {
        // tslint:disable-next-line:no-console
        console.error(typeof content === "string" ? this.render(content) : this.formatMessage("ERROR", content, chalk.red.bold));
    }
}

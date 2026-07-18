import chalk from "chalk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { singleton } from "tsyringe";

@singleton()
export class LoggerService {
    constructor() {
        const renderer = new TerminalRenderer({
            tableOptions: {
                chars: {
                    mid: "─",
                    "left-mid": "├",
                    "mid-mid": "┼",
                    "right-mid": "┤",
                },
                style: {
                    head: ["yellow", "bold"],
                    "padding-left": 1,
                    "padding-right": 1,
                },
            },
        }) as any;

        const originalTable = renderer.table.bind(renderer);
        renderer.table = (header: any, body: any) => {
            const tableStr = originalTable(header, body);
            const lines = tableStr.split("\n");
            let midLineCount = 0;
            return lines
                .filter((line: string) => {
                    const cleanLine = line.replace(/\u001b\[[0-9;]*m/g, "");
                    // Separator lines between rows start with '├' when using default box characters
                    if (cleanLine.startsWith("├")) {
                        midLineCount++;
                        return midLineCount === 1; // Only keep the first separator (after header)
                    }
                    return true;
                })
                .join("\n");
        };

        marked.setOptions({ renderer });
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

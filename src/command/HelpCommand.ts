import chalk from "chalk";
import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";

@Command([["-h"], ["--help"], ["help"]], "Show help")
@singleton()
export class HelpCommand extends BaseCommand {
    private loggerService = container.resolve(LoggerService);

    public async execute() {
        const definitions = this.cli.definitions();

        // Filter out help and version commands
        const commands = definitions.filter(
            (d) =>
                !d.path.includes(" help") &&
                !d.path.includes(" --help") &&
                !d.path.includes(" -h") &&
                !d.path.includes(" --version") &&
                !d.path.includes(" -v"),
        );

        const binaryName = this.cli.binaryName || "space";

        // Usage
        this.loggerService.log(
            `\n  ${chalk.bold("Usage:")} ${chalk.yellow("$")} ${chalk.cyan(binaryName)} ${chalk.yellow("<command>")}\n`,
        );

        // Commands section header
        this.loggerService.log(`  ${chalk.bold.magenta("Commands:")}\n`);

        // Calculate max width for command paths (excluding binary name)
        const commandInfos = commands.map((d) => {
            let commandUsage = d.usage.replace(
                new RegExp(`^${binaryName} `),
                "",
            );
            if (d.options.some((o) => o.preferredName === "--json")) {
                commandUsage += " [--json]";
            }
            return {
                usage: commandUsage,
                description: d.description?.trim().split("\n")[0] || "",
            };
        });

        const maxWidth =
            Math.max(...commandInfos.map((c) => c.usage.length)) + 2;

        for (const info of commandInfos) {
            const paddedUsage = info.usage.padEnd(maxWidth);
            this.loggerService.log(
                `    ${chalk.green.bold(paddedUsage)} ${chalk.white(info.description)}`,
            );
        }

        // Footer
        this.loggerService.log(
            `\n  ${chalk.gray("Tip: Use")} ${chalk.cyan(`${binaryName} <command> --help`)} ${chalk.gray("for detailed info.")}\n`,
        );
    }
}

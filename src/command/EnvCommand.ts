import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("env", "Show environment variables for the active space")
@singleton()
export class EnvCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public json = Option.Boolean("--json", false, {
        description: "Output the data as JSON",
    });

    public async execute() {
        const activeSpace = await this.spaceService.getActive();
        if (!activeSpace) {
            this.loggerService.error("No active space found");
            return;
        }

        const env = await this.spaceService.getEnv(activeSpace);

        if (this.json) {
            this.loggerService.log(JSON.stringify(env, null, 2));
            return;
        }

        this.loggerService.info(
            chalk.cyan.bold(
                `\n🌍  Environment Variables for '${activeSpace.space.name}'\n`,
            ),
        );

        const entries = Object.entries(env);
        if (entries.length === 0) {
            this.loggerService.info(chalk.yellow("  No environment variables found."));
            return;
        }

        let table = "| Variable | Value |\n";
        table += "| --- | --- |\n";

        for (const [key, value] of entries) {
            table += `| ${chalk.green(key)} | ${chalk.cyan(value)} |\n`;
        }

        this.loggerService.info(table);
        this.loggerService.info("");
    }
}

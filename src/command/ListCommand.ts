import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("list", "List all available spaces")
@singleton()
export class ListCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);
    private pathService = container.resolve(PathService);

    public json = Option.Boolean("--json", false, {
        description: "Output the data as JSON",
    });

    public async execute() {
        const spaces = await this.spaceService.list();
        const active = await this.spaceService.getActive();

        if (this.json) {
            this.loggerService.log(JSON.stringify(spaces, null, 2));
            return;
        }

        this.loggerService.info(chalk.cyan.bold("🚀  Available Spaces"));

        if (spaces.length === 0) {
            this.loggerService.info(chalk.yellow("  No spaces found."));
            return;
        }

        let table = "| Name | Path |\n";
        table += "| --- | --- |\n";

        spaces.forEach((space) => {
            const isActive = active && space.space.name === active.space.name;
            const name = isActive
                ? chalk.yellow.bold(`* ${space.space.name}`)
                : space.space.name;
            const displayPath = this.pathService.formatDisplayPath(
                space.space.path,
            );

            table += `| ${chalk.green(name)} | ${chalk.cyan(displayPath)} |\n`;
        });

        this.loggerService.info(table);
    }
}

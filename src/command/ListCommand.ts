import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("list", "List all available spaces")
@singleton()
export class ListCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

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

        this.loggerService.info(chalk.cyan.bold("\n🚀  Available Spaces\n"));

        if (spaces.length === 0) {
            this.loggerService.info(chalk.yellow("  No spaces found."));
            return;
        }

        spaces.forEach((space) => {
            const isActive = active && space.space.name === active.space.name;
            const icon = isActive ? chalk.green("●") : chalk.gray("○");
            const name = isActive
                ? chalk.green.bold(space.space.name)
                : chalk.white(space.space.name);
            const path = chalk.gray(`(${space.space.path})`);

            this.loggerService.info(`  ${icon} ${name.padEnd(20)} ${path}`);
        });
        this.loggerService.info("");
    }
}

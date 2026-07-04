import chalk from "chalk";
import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("init", "Initialize a new space in the current directory")
@singleton()
export class InitCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public async execute() {
        try {
            const space = await this.spaceService.init();
            this.loggerService.info(
                `Successfully initialized space: ${chalk.green(chalk.bold(space.space.name))}`,
            );
            this.loggerService.info(
                `Run ${chalk.cyan(`space use ${space.space.name}`)} to open the space`,
            );
        } catch (error) {
            this.loggerService.error(
                `Failed to initialize space: ${error instanceof Error ? error.message : error}`,
            );
            return 1;
        }
    }
}

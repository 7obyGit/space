import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("create", "Create a new space")
@singleton()
export class CreateCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public name = Option.String();

    public async execute() {
        try {
            const space = await this.spaceService.create(this.name);
            this.loggerService.info(
                `Successfully created space: ${chalk.green(chalk.bold(space.space.name))}`,
            );
        } catch (error) {
            this.loggerService.error(`Failed to create space: ${error instanceof Error ? error.message : error}`);
            return 1;
        }
    }
}

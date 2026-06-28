import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("delete", "Delete a space")
@singleton()
export class DeleteCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public name = Option.String();

    public async execute() {
        const result = await this.spaceService.delete(this.name);

        if (result.isError()) {
            this.loggerService.error(result.getError()!);
            return 1;
        }

        if (result.getValue() === true) {
            this.loggerService.info(
                `Successfully deleted space: ${chalk.red(chalk.bold(this.name))}`,
            );
        } else {
            // SpaceService.delete logs warnings if it doesn't exist or is active
            // and returns Result.success(false).
        }
    }
}

import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { SpaceService } from "../service/SpaceService.js";
import { LoggerService } from "../service/LoggerService.js";

@Command("use", "Switch to a different workspace")
@singleton()
export class UseCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public nameOrPath = Option.String();

    public async execute() {
        const result = await this.spaceService.use(this.nameOrPath);

        if (result.isError()) {
            this.loggerService.error(result.getError()!);
            return 1;
        }

        this.loggerService.info(
            `Switched to space: ${chalk.green(chalk.bold(result.getValue()!.space.name))}`,
        );
    }
}

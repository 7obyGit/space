import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("pop", "Remove the first folder from the active space")
@singleton()
export class PopCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public async execute() {
        const result = await this.spaceService.popFolderFromActive();
        if (result.isError()) {
            this.loggerService.error(result.getError());
            return 1;
        }
        this.loggerService.info(`Popped first folder from active space.`);
    }
}

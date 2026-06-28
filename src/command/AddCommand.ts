import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("add", "Add a folder to the active space")
@singleton()
export class AddCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

    public folderPath = Option.String({ name: "path", required: false });

    public async execute() {
        const result = await this.spaceService.addFolderToActive(this.folderPath);
        if (result.isError()) {
            this.loggerService.error(result.getError());
            return 1;
        }
        this.loggerService.info(`Added folder to active space.`);
    }
}

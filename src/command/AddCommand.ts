import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("add", "Add a folder to the active space")
@singleton()
export class AddCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);
    private pathService = container.resolve(PathService);

    public folderPath = Option.String({ name: "path", required: false });

    public async execute() {
        const result = await this.spaceService.addFolderToActive(this.folderPath);
        if (result.isError()) {
            this.loggerService.error(result.getError());
            return 1;
        }
        const targetPath = this.folderPath
            ? this.pathService.toAbsolute(this.folderPath)
            : this.pathService.getCurrentWorkingDirectory();
        const displayPath = this.pathService.formatDisplayPath(targetPath);
        this.loggerService.info(`Added folder ${chalk.cyan(chalk.bold(displayPath))} to active space.`);
    }
}

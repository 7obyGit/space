import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";
import { FileService } from "../service/fs/FileService.js";

@Command("remove", "Remove a folder from the active space")
@singleton()
export class RemoveCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);
    private pathService = container.resolve(PathService);
    private fileService = container.resolve(FileService);

    public folderPath = Option.String({ name: "path", required: false });

    public async execute() {
        const result = await this.spaceService.removeFolderFromActive(
            this.folderPath,
        );
        if (result.isError()) {
            this.loggerService.error(result.getError());
            return 1;
        }
        const targetPath = this.folderPath
            ? this.pathService.toAbsolute(this.folderPath)
            : this.pathService.getCurrentWorkingDirectory();
        const displayPath = this.pathService.formatDisplayPath(targetPath);

        const entityType: string = (await this.fileService.isDirectory(
            targetPath,
        ))
            ? "folder"
            : "file";

        this.loggerService.info(
            `Removed ${entityType} ${chalk.cyan(chalk.bold(displayPath))} from active space.`,
        );
    }
}

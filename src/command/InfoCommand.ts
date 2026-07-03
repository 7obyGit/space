import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command(BaseCommand.Default, "Show information about the current active space")
@singleton()
export class InfoCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);
    private pathService = container.resolve(PathService);

    public json = Option.Boolean("--json", false, {
        description: "Output the data as JSON",
    });

    public async execute() {
        const active = await this.spaceService.getActive();

        if (this.json) {
            this.loggerService.log(JSON.stringify(active, null, 2));
            return;
        }

        if (!active) {
            this.loggerService.info(chalk.yellow("\n  No active space found."));
            return;
        }

        this.loggerService.info(
            chalk.cyan.bold("\n🚀  Current Active Space\n"),
        );

        const displayName = chalk.bold(active.space.name);
        const displayPath = this.pathService.formatDisplayPath(
            active.space.path,
        );
        this.loggerService.info(
            `  ${chalk.yellow("●")} ${displayName} - ${chalk.cyan(displayPath)}`,
        );

        if (active.folders && active.folders.length > 0) {
            this.loggerService.info(chalk.white.bold("\n  Folders:"));
            let foldersTable = "| Name | Path |\n";
            foldersTable += "| --- | --- |\n";
            active.folders.forEach((folder) => {
                const folderPath =
                    (folder as any).path || (folder as any).uri || "Unknown";
                const displayFolderPath =
                    this.pathService.formatDisplayPath(folderPath);
                const folderName = folder.name || "-";
                foldersTable += `| ${chalk.green(folderName)} | ${chalk.cyan(displayFolderPath)} |\n`;
            });
            this.loggerService.info(foldersTable);
        }

        if (
            active.space.attachedFiles &&
            active.space.attachedFiles.length > 0
        ) {
            this.loggerService.info(chalk.white.bold("\n  Attached Files:"));
            let filesTable = "| File Path |\n";
            filesTable += "| --- |\n";
            active.space.attachedFiles.forEach((file) => {
                const displayFilePath =
                    this.pathService.formatDisplayPath(file);
                filesTable += `| ${chalk.cyan(displayFilePath)} |\n`;
            });
            this.loggerService.info(filesTable);
        }

        this.loggerService.info("");
    }
}

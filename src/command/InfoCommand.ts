import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command(
    [["info"], BaseCommand.Default],
    "Show information about the current active space",
)
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
            this.loggerService.info(chalk.yellow("  No active space found."));
            return;
        }

        this.loggerService.info(
            chalk.cyan.bold("🚀  Current Active Space"),
        );

        const displayName = chalk.bold(active.space.name);
        const displayPath = this.pathService.formatDisplayPath(
            active.space.path,
        );
        this.loggerService.info(
            `  ${chalk.yellow("●")} ${displayName} - ${chalk.cyan(displayPath)}`,
        );

        const combinedItems: { name: string; path: string }[] = [];
 
         if (active.folders && active.folders.length > 0) {
             active.folders
                 .filter((f) => (f as any).name !== "Attached Files")
                 .forEach((folder) => {
                     const folderPath =
                         (folder as any).path ||
                         (folder as any).uri ||
                         "Unknown";
                     const folderName =
                         folder.name || this.pathService.getName(folderPath);
                     combinedItems.push({
                        name: folderName,
                        path: folderPath,
                    });
                 });
         }
 
         if (
             active.space.attachedFiles &&
             active.space.attachedFiles.length > 0
         ) {
             active.space.attachedFiles.forEach((file) => {
                 combinedItems.push({
                    name: this.pathService.getName(file),
                    path: file,
                });
             });
         }
 
         if (combinedItems.length > 0) {
             this.loggerService.info(chalk.white.bold("\n  Workspace Content:"));
             let table = "| Name | Path |\n";
             table += "| --- | --- |\n";
             combinedItems.forEach((item) => {
                 const displayPath = this.pathService.formatDisplayPath(
                     item.path,
                 );
                 table += `| ${chalk.green(item.name)} | ${chalk.cyan(displayPath)} |\n`;
             });
             this.loggerService.info(table);
         }
    }
}

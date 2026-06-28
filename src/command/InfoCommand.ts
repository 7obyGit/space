import chalk from "chalk";
import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";

@Command(BaseCommand.Default, "Show information about the current active space")
@singleton()
export class InfoCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);

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

        this.loggerService.info(chalk.cyan.bold("\n🚀  Current Active Space\n"));
        
        const name = chalk.green.bold(active.space.name);
        const path = chalk.gray(`(${active.space.path})`);
        this.loggerService.info(`  ${chalk.green("●")} ${name.padEnd(20)} ${path}`);

        if (active.folders && active.folders.length > 0) {
            this.loggerService.info(chalk.white.bold("\n  Folders:"));
            active.folders.forEach((folder) => {
                const folderPath =
                    (folder as any).path || (folder as any).uri || "Unknown";
                const folderName = folder.name ? ` (${folder.name})` : "";
                this.loggerService.info(
                    `    ${chalk.gray("-")} ${folderPath}${chalk.gray(folderName)}`,
                );
            });
        }

        if (
            active.space.attachedFiles &&
            active.space.attachedFiles.length > 0
        ) {
            this.loggerService.info(chalk.white.bold("\n  Attached Files:"));
            active.space.attachedFiles.forEach((file) => {
                this.loggerService.info(`    ${chalk.gray("-")} ${file}`);
            });
        }
        
        this.loggerService.info("");
    }
}

import chalk from "chalk";
import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";
import { TerminalService } from "../service/TerminalService.js";

@Command("scratch", "Create a clean slate scratch space")
@singleton()
export class ScratchCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);
    private terminalService = container.resolve(TerminalService);
    private pathService = container.resolve(PathService);

    public async execute() {
        try {
            this.loggerService.info("Creating scratch space...");
            const { workspacePath, readmePath } =
                await this.spaceService.scratch();

            this.loggerService.info(
                `Successfully created scratch space at: ${chalk.green(chalk.bold(workspacePath))}`,
            );

            this.loggerService.info(`Opening scratch workspace in VS Code...`);

            const trueWorkspacePath =
                this.pathService.toAbsolute(workspacePath);
            const trueReadmePath = this.pathService.toAbsolute(readmePath);

            // Open both the workspace and the README
            await this.terminalService.run(
                `code "${trueWorkspacePath}" "${trueReadmePath}"`,
            );
        } catch (error) {
            this.loggerService.error(
                `Failed to create scratch space: ${error instanceof Error ? error.message : error}`,
            );
            return 1;
        }
    }
}

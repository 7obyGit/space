import chalk from "chalk";
import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";
import { TerminalService } from "../service/TerminalService.js";

@Command("clone", "Create a temporary scratch space")
@singleton()
export class CloneCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private loggerService = container.resolve(LoggerService);
    private terminalService = container.resolve(TerminalService);
    private pathService = container.resolve(PathService);

    public async execute() {
        try {
            this.loggerService.info("Creating scratch space...");
            const scratchPath = await this.spaceService.clone();

            this.loggerService.info(
                `Successfully created scratch space at: ${chalk.green(chalk.bold(scratchPath))}`,
            );

            this.loggerService.info(`Opening scratch workspace in VS Code...`);

            const truePath = this.pathService.toAbsolute(scratchPath);
            await this.terminalService.run(`code "${truePath}"`);
        } catch (error) {
            this.loggerService.error(
                `Failed to create scratch space: ${error instanceof Error ? error.message : error}`,
            );
            return 1;
        }
    }
}

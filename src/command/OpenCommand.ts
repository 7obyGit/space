import chalk from "chalk";
import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { PathService } from "../service/fs/PathService.js";
import { LoggerService } from "../service/LoggerService.js";
import { SpaceService } from "../service/SpaceService.js";
import { TerminalService } from "../service/TerminalService.js";

@Command("open", "Open the active workspace in VS Code")
@singleton()
export class OpenCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);
    private terminalService = container.resolve(TerminalService);
    private loggerService = container.resolve(LoggerService);
    private pathService = container.resolve(PathService);

    public async execute() {
        const activePath = await this.spaceService.getActivePath();
        this.loggerService.info(
            `Opening workspace ${chalk.cyan(chalk.bold(activePath))} in VS Code...`,
        );

        const truePath = this.pathService.toAbsolute(activePath);
        await this.terminalService.run(`code "${truePath}"`);
    }
}

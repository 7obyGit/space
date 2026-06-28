import { Command as BaseCommand } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { ConfigService } from "../service/ConfigService.js";
import { LoggerService } from "../service/LoggerService.js";

@Command("config", "Output all loaded config as JSON")
@singleton()
export class ConfigCommand extends BaseCommand {
    private configService = container.resolve(ConfigService);
    private loggerService = container.resolve(LoggerService);

    public async execute() {
        try {
            const config = await this.configService.get();
            this.loggerService.log(JSON.stringify(config, null, 2));
        } catch (error) {
            this.loggerService.error(`Failed to load config: ${error instanceof Error ? error.message : error}`);
            return 1;
        }
    }
}

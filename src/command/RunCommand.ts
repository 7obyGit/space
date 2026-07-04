import { Command as BaseCommand, Option } from "clipanion";
import { container, singleton } from "tsyringe";
import { Command } from "../decorators/Command.js";
import { SpaceService } from "../service/SpaceService.js";

@Command("run", "Run a script defined in the active workspace file")
@singleton()
export class RunCommand extends BaseCommand {
    private spaceService = container.resolve(SpaceService);

    public scriptName = Option.String({ name: "script", required: true });

    public async execute() {
        await this.spaceService.runScript(this.scriptName);
    }
}

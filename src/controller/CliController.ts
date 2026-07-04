import { Builtins, Cli } from "clipanion";
import { singleton } from "tsyringe";
import { AddCommand } from "../command/AddCommand.js";
import { CloneCommand } from "../command/CloneCommand.js";
import { ConfigCommand } from "../command/ConfigCommand.js";
import { CreateCommand } from "../command/CreateCommand.js";
import { DeleteCommand } from "../command/DeleteCommand.js";
import { EnvCommand } from "../command/EnvCommand.js";
import { InfoCommand } from "../command/InfoCommand.js";
import { InitCommand } from "../command/InitCommand.js";
import { ListCommand } from "../command/ListCommand.js";
import { OpenCommand } from "../command/OpenCommand.js";
import { PopCommand } from "../command/PopCommand.js";
import { RemoveCommand } from "../command/RemoveCommand.js";
import { RunCommand } from "../command/RunCommand.js";
import { ScratchCommand } from "../command/ScratchCommand.js";
import { UseCommand } from "../command/UseCommand.js";

@singleton()
export class CliController {
    public async run() {
        const cli = new Cli({
            binaryLabel: "space",
            binaryName: "space",
            binaryVersion: "0.0.1",
        });

        cli.register(InfoCommand);
        cli.register(ListCommand);
        cli.register(AddCommand);
        cli.register(CloneCommand);
        cli.register(ScratchCommand);
        cli.register(RemoveCommand);
        cli.register(RunCommand);
        cli.register(PopCommand);
        cli.register(UseCommand);
        cli.register(OpenCommand);
        cli.register(InitCommand);
        cli.register(CreateCommand);
        cli.register(DeleteCommand);
        cli.register(EnvCommand);
        cli.register(ConfigCommand);
        cli.register(Builtins.HelpCommand);
        cli.register(Builtins.VersionCommand);

        await cli.runExit(process.argv.slice(2));
    }
}

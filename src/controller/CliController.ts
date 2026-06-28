import { Builtins, Cli } from "clipanion";
import { singleton } from "tsyringe";
import { AddCommand } from "../command/AddCommand.js";
import { InfoCommand } from "../command/InfoCommand.js";
import { ListCommand } from "../command/ListCommand.js";
import { PopCommand } from "../command/PopCommand.js";
import { RemoveCommand } from "../command/RemoveCommand.js";

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
        cli.register(RemoveCommand);
        cli.register(PopCommand);
        cli.register(Builtins.HelpCommand);
        cli.register(Builtins.VersionCommand);

        await cli.runExit(process.argv.slice(2));
    }
}

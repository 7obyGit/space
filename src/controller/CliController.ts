import { Builtins, Cli } from "clipanion";
import { singleton } from "tsyringe";
import { ListCommand } from "../command/ListCommand.js";

@singleton()
export class CliController {
    public async run() {
        const cli = new Cli({
            binaryLabel: "space",
            binaryName: "space",
            binaryVersion: "0.0.1",
        });

        cli.register(ListCommand);
        cli.register(Builtins.HelpCommand);
        cli.register(Builtins.VersionCommand);

        await cli.runExit(process.argv.slice(2));
    }
}

import { container } from "tsyringe";
import { SpaceService } from "../service/SpaceService.js";

export function Command(path: string | symbol | any[], description?: string) {
    return (constructor: any) => {
        const originalExecute = constructor.prototype.execute;

        let commandName: string | undefined;
        let paths: any[][];

        if (Array.isArray(path)) {
            if (path.length > 0 && Array.isArray(path[0])) {
                paths = path;
                commandName = paths[0].find((p) => typeof p === "string");
            } else {
                paths = [path as any[]];
                commandName = (path as any[]).find((p) => typeof p === "string");
            }
        } else {
            paths = [[path]];
            if (typeof path === "string") {
                commandName = path;
            }
        }

        if (commandName) {
            constructor.prototype.execute = async function (...args: any[]) {
                const spaceService = container.resolve(SpaceService);
                await spaceService.runHook(commandName!, "pre-command");
                await spaceService.runHook(commandName!, "command");
                const result = await originalExecute.apply(this, args);
                await spaceService.runHook(commandName!, "post-command");
                return result;
            };
        }

        constructor.paths = paths;
        if (description) {
            constructor.usage = constructor.Usage?.({ description });
        }
    };
}

import { container } from "tsyringe";
import { SpaceService } from "../service/SpaceService.js";

export function Command(path: string | symbol | any[], description?: string) {
    return (constructor: any) => {
        const originalExecute = constructor.prototype.execute;
        const commandName = Array.isArray(path)
            ? typeof path[0] === "string"
                ? path[0]
                : undefined
            : typeof path === "string"
              ? path
              : undefined;

        if (commandName) {
            constructor.prototype.execute = async function (...args: any[]) {
                const spaceService = container.resolve(SpaceService);
                await spaceService.runHook(commandName, "pre-command");
                const result = await originalExecute.apply(this, args);
                await spaceService.runHook(commandName, "post-command");
                return result;
            };
        }

        constructor.paths = Array.isArray(path) ? [path] : [[path]];
        if (description) {
            constructor.usage = constructor.Usage?.({ description });
        }
    };
}

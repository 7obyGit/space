import { inject, singleton } from "tsyringe";
import type { TVersion } from "../types/Config.js";
import type { TFilePath } from "../types/PathTypes.js";
import type { TResult } from "../types/Result.js";
import { PathService } from "./fs/PathService.js";
import { JsonService } from "./JsonService.js";

@singleton()
export class AppService {
    constructor(
        @inject(PathService) private pathService: PathService,
        @inject(JsonService) private jsonService: JsonService,
    ) {}

    public async getVersion(): Promise<TVersion> {
        // Resolves package.json straight from your project root at runtime
        const path: TFilePath = this.pathService.join(
            this.pathService.getCurrentWorkingDirectory(),
            "package.json",
        );

        const content: TResult<{ version: string }, string> =
            await this.jsonService.load(path);
        if (content.isError()) {
            throw Error(
                `Failed to read package version from package.json - ${content.getError()}`,
            );
        }

        return content.getValue()?.version! as TVersion;
    }
}

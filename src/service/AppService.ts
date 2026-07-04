import { dirname } from "path";
import { inject, singleton } from "tsyringe";
import { fileURLToPath } from "url";
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
        // Resolves package.json relative to this file's location
        const currentFilePath = fileURLToPath(import.meta.url);
        const currentDirPath = dirname(currentFilePath);
        const path: TFilePath = this.pathService.join(
            currentDirPath,
            "..",
            "..",
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

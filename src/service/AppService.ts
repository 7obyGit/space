import type { IConfig, TVersion } from "../types/Config.js";
import type { TDirectoryPath, TFilePath } from "../types/PathTypes.js";
import type { TResult } from "../types/Result.js";
import { FileService } from "./fs/FileService.js";
import { PathService } from "./fs/PathService.js";
import { JsonService } from "./JsonService.js";

export class AppService {
    public static async getVersion(): Promise<TVersion> {
        // Resolves package.json straight from your project root at runtime
        const path: TFilePath = PathService.join(
            PathService.getCurrentWorkingDirectory(),
            "package.json",
        );

        const content: TResult<IConfig, string> = await JsonService.load(path);
        if (content.isError()) {
            throw Error(
                `Failed to read package version from package.json - ${content.getError()}`,
            );
        }

        return content.getValue()?.version!;
    }
}

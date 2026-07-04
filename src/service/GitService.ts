import { inject, singleton } from "tsyringe";
import type { TDirectoryPath } from "../types/PathTypes.js";
import { TerminalService } from "./TerminalService.js";

@singleton()
export class GitService {
    constructor(
        @inject(TerminalService) private terminalService: TerminalService,
    ) {}

    /**
     * Finds the git root for a given path.
     * Returns undefined if the path is not in a git repository or git is not available.
     */
    public async getGitRoot(path: string): Promise<TDirectoryPath | undefined> {
        // Use git rev-parse --show-toplevel to find the root of the repository.
        // -C ensures git runs as if it were in the specified directory.
        const result = await this.terminalService.run(
            `git -C "${path}" rev-parse --show-toplevel`,
        );

        if (result.isSuccess()) {
            const value = result.getValue();
            if (value && value.exitCode === 0) {
                return value.stdout.trim() as TDirectoryPath;
            }
        }

        return undefined;
    }

    /**
     * Checks if two paths are in the same git repository.
     */
    public async isSameRepo(pathA: string, pathB: string): Promise<boolean> {
        const rootA = await this.getGitRoot(pathA);
        if (!rootA) { return false; }

        const rootB = await this.getGitRoot(pathB);
        if (!rootB) { return false; }

        return rootA === rootB;
    }
}

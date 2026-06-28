import { singleton } from "tsyringe";
import { symlink, readlink, realpath } from "node:fs/promises";
import { Result, type TResult } from "../../types/Result.js";
import type { TSymlink, TPath } from "../../types/PathTypes.js";

@singleton()
export class LinkService {
    public async create(link: TSymlink): Promise<TResult<void, string>> {
        try {
            await symlink(link.to, link.from);
            return Result.success(undefined);
        } catch (error) {
            return Result.error(
                `Failed to create symlink at '${link.from}' pointing to '${link.to}' - error: ${error}`,
            );
        }
    }

    // Gets the path the current link points to, may be another link
    public async getLinkTarget(
        path: TPath,
    ): Promise<TResult<TPath, string>> {
        try {
            return Result.success(await readlink(path));
        } catch (error) {
            return Result.error(
                `Failed to read symlink at '${path}' - error: ${error}`,
            );
        }
    }

    // Gets the real path the link point to, should not be a symlink
    public async getRealPath(
        path: TPath,
    ): Promise<TResult<TPath, string>> {
        try {
            return Result.success(await realpath(path));
        } catch (error) {
            return Result.error(
                `Failed to resolve real path for '${path}' - error: ${error}`,
            );
        }
    }
}

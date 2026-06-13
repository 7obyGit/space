import {
    cp,
    lstat,
    mkdir,
    readdir,
    readFile,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import { Result, type TResult } from "../../types/Result.js";
import { PathService } from "./PathService.js";
import type {
    TPath,
    TFilePath,
    TDirectoryPath,
} from "../../types/PathTypes.js";

export class FileService {
    public static async exists(path: TPath): Promise<boolean> {
        path = PathService.toAbsolute(path);

        try {
            await stat(path);
            return true;
        } catch {
            return false;
        }
    }

    public static async isFile(path: TFilePath): Promise<boolean> {
        path = PathService.toAbsolute(path);

        try {
            const stats = await stat(path);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    public static async isDirectory(path: TDirectoryPath): Promise<boolean> {
        path = PathService.toAbsolute(path);

        try {
            const stats = await stat(path);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    public static async isSymlink(path: TPath): Promise<boolean> {
        path = PathService.toAbsolute(path);

        try {
            const stats = await lstat(path);
            return stats.isSymbolicLink();
        } catch {
            return false;
        }
    }

    public static async read(
        path: TFilePath,
    ): Promise<TResult<string, string>> {
        path = PathService.toAbsolute(path);

        const parentDirectory: string = PathService.getParent(path);
        if ((await this.exists(parentDirectory)) === false) {
            await this.createDirectory(parentDirectory);
        }

        try {
            return Result.success(await readFile(path, "utf8"));
        } catch (error) {
            return Result.error(
                `Failed to read file at '${path}' - error: ${error}`,
            );
        }
    }

    public static async write(
        path: TFilePath,
        content: string,
    ): Promise<TResult<void, string>> {
        path = PathService.toAbsolute(path);

        const parentDirectory: string = PathService.getParent(path);
        if ((await this.exists(parentDirectory)) === false) {
            await this.createDirectory(parentDirectory);
        }

        try {
            return Result.success(await writeFile(path, content, "utf8"));
        } catch (error) {
            return Result.error(
                `Failed to write file at '${path}' - error: ${error}`,
            );
        }
    }

    public static async delete(path: TPath): Promise<TResult<void, string>> {
        path = PathService.toAbsolute(path);

        try {
            await rm(path, { force: true, recursive: true });
            return Result.success(undefined);
        } catch (error) {
            return Result.error(
                `Failed to delete path at '${path}' - error: ${error}`,
            );
        }
    }

    public static async createDirectory(
        path: TDirectoryPath,
    ): Promise<TResult<void, string>> {
        path = PathService.toAbsolute(path);

        try {
            await mkdir(path, { recursive: true });
            return Result.success(undefined);
        } catch (error) {
            return Result.error(
                `Failed to create directory at '${path}' - error: ${error}`,
            );
        }
    }

    public static async listFiles(
        path: TDirectoryPath,
    ): Promise<TResult<TFilePath[], string>> {
        path = PathService.toAbsolute(path);

        if ((await this.exists(path)) === false) {
            return Result.error(`Directory '${path}' does not exist`);
        }

        try {
            const entries = await readdir(path, { withFileTypes: true });
            const files = entries
                .filter((entry) => entry.isFile())
                .map((entry) => PathService.join(path, entry.name));
            return Result.success(files);
        } catch (error) {
            return Result.error(
                `Failed to list files in directory at '${path}' - error: ${error}`,
            );
        }
    }

    public static async listDirectories(
        path: TDirectoryPath,
    ): Promise<TResult<TDirectoryPath[], string>> {
        path = PathService.toAbsolute(path);

        if ((await this.exists(path)) === false) {
            return Result.error(`Directory '${path}' does not exist`);
        }

        try {
            const entries = await readdir(path, { withFileTypes: true });
            const directories = entries
                .filter((entry) => entry.isDirectory())
                .map((entry) => PathService.join(path, entry.name));
            return Result.success(directories);
        } catch (error) {
            return Result.error(
                `Failed to list directories in directory at '${path}' - error: ${error}`,
            );
        }
    }

    public static async copy(
        source: TPath,
        destination: TPath,
    ): Promise<TResult<void, string>> {
        source = PathService.toAbsolute(source);
        destination = PathService.toAbsolute(destination);

        if ((await this.exists(source)) === false) {
            return Result.error(`Source '${source}' does not exist`);
        }

        const destinationParent: TDirectoryPath =
            PathService.getParent(destination);
        if (await this.exists(destinationParent)) {
            await this.createDirectory(destinationParent);
        }

        try {
            await cp(source, destination, { recursive: true });
            return Result.success(undefined);
        } catch (error) {
            return Result.error(
                `Failed to copy from '${source}' to '${destination}' - error: ${error}`,
            );
        }
    }
}

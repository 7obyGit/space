import { readFile, writeFile } from "node:fs/promises";
import { Result, type TResult } from "../types/Result.js";

export type TFilePath = string;
export type TDirectoryPath = string;
export type TPath = TFilePath | TDirectoryPath;
export type TSymlink = { from: TPath; to: TPath };

export class FileService {
    public static async read(path: TFilePath): Promise<TResult<string, string>> {
        try {
            return Result.success(await readFile(path, "utf8"));
        } catch (error) {
            return Result.error(`Failed to read file at '${path}' - error: ${error}`)
        }
    }

    public static async write(path: TFilePath, content: string): Promise<TResult<void, string>> {
        try {
            return Result.success(await writeFile(path, content, "utf8"));
        } catch (error) {
            return Result.error(`Failed to write file at '${path}' - error: ${error}`);
        }
    }
}

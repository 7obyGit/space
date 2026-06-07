import {
    resolve,
    relative,
    dirname,
    basename,
    extname,
    isAbsolute,
    join,
    normalize,
} from "node:path";
import type {
    TPath,
    TDirectoryPath,
    TFilePath,
    TFileName,
    TFileExtension,
} from "../../types/PathTypes.js";

export class PathService {
    public static isAbsolute(path: TPath): boolean {
        return isAbsolute(path);
    }

    public static toAbsolute(path: TPath, base?: TDirectoryPath): TPath {
        return resolve(base ?? process.cwd(), path);
    }

    public static toRelative(from: TPath, to: TPath): TPath {
        return relative(from, to);
    }

    public static getParent(path: TPath): TDirectoryPath {
        return dirname(resolve(path));
    }

    public static getName(path: TFilePath): TFileName {
        return basename(path);
    }

    public static getExtension(path: TFilePath): TFileExtension {
        return extname(path);
    }

    public static isFileSystemRoot(path: TPath): boolean {
        const absPath = resolve(path);
        return absPath === dirname(absPath);
    }

    public static join(...segments: string[]): TPath {
        return join(...segments);
    }

    public static normalize(path: TPath): TPath {
        return normalize(path);
    }
}

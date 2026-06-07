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
    public static getCurrentWorkingDirectory(): TDirectoryPath {
        return process.cwd();
    }

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

    public static getParents(path: TPath): TDirectoryPath[] {
        const parents: TDirectoryPath[] = [];
        let current: TPath = resolve(path);

        while (!this.isFileSystemRoot(current)) {
            current = dirname(current);
            parents.push(current);
        }

        return parents;
    }

    public static getName(path: TFilePath, extension?: TFileExtension): TFileName {
        return basename(path, extension);
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

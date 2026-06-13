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
import { homedir } from "node:os";
import type {
    TPath,
    TDirectoryPath,
    TFilePath,
    TFileName,
    TFileExtension,
} from "../../types/PathTypes.js";

export class PathService {
    private static expandHome(path: string): string {
        return path.replace(/^~(?=$|\/|\\)/, homedir());
    }

    public static getCurrentWorkingDirectory(): TDirectoryPath {
        return process.cwd();
    }

    public static isAbsolute(path: TPath): boolean {
        return isAbsolute(this.expandHome(path));
    }

    public static toAbsolute(path: TPath, base?: TDirectoryPath): TPath {
        const targetPath = this.expandHome(path);

        if (isAbsolute(targetPath)) {
            return resolve(targetPath);
        }

        const targetBase = base ? this.expandHome(base) : process.cwd();
        return resolve(targetBase, targetPath);
    }

    public static toRelative(from: TPath, to: TPath): TPath {
        return relative(this.expandHome(from), this.expandHome(to));
    }

    public static getParent(path: TPath): TDirectoryPath {
        return dirname(resolve(this.expandHome(path)));
    }

    public static getParents(
        path: TPath,
        options: { includeCurrentWorkingDirectory: boolean } = {
            includeCurrentWorkingDirectory: false,
        },
    ): TDirectoryPath[] {
        const parents: TDirectoryPath[] = [];
        let current: TPath = resolve(this.expandHome(path));

        while (!this.isFileSystemRoot(current)) {
            current = dirname(current);
            parents.push(current);
        }

        parents.reverse();

        if (options.includeCurrentWorkingDirectory === true) {
            parents.push(this.getCurrentWorkingDirectory());
        }

        return parents;
    }

    public static getName(
        path: TFilePath,
        extension?: TFileExtension,
    ): TFileName {
        return basename(this.expandHome(path), extension);
    }

    public static getExtension(path: TFilePath): TFileExtension {
        return extname(this.expandHome(path));
    }

    public static isFileSystemRoot(path: TPath): boolean {
        const absPath = resolve(this.expandHome(path));
        return absPath === dirname(absPath);
    }

    public static join(...segments: string[]): TPath {
        // Map over segments to expand a tilde if it forms the beginning of the joined path
        const expandedSegments = segments.map((segment, index) => {
            return index === 0 ? this.expandHome(segment) : segment;
        });
        return join(...expandedSegments);
    }

    public static normalize(path: TPath): TPath {
        return normalize(this.expandHome(path));
    }
}

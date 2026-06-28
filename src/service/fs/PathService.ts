import { homedir } from "node:os";
import {
    basename,
    dirname,
    extname,
    isAbsolute,
    join,
    normalize,
    relative,
    resolve,
} from "node:path";
import { singleton } from "tsyringe";
import type {
    TDirectoryPath,
    TFileExtension,
    TFileName,
    TFilePath,
    TPath,
} from "../../types/PathTypes.js";

@singleton()
export class PathService {

    public getCurrentWorkingDirectory(): TDirectoryPath {
        return process.cwd();
    }

    public isAbsolute(path: TPath): boolean {
        return isAbsolute(this.expandHome(path));
    }

    public toAbsolute(path: TPath, base?: TDirectoryPath): TPath {
        const targetPath = this.expandHome(path);

        if (isAbsolute(targetPath)) {
            return resolve(targetPath);
        }

        const targetBase = base ? this.expandHome(base) : process.cwd();
        return resolve(targetBase, targetPath);
    }

    public toRelative(from: TPath, to: TPath): TPath {
        return relative(this.expandHome(from), this.expandHome(to));
    }

    public getParent(path: TPath): TDirectoryPath {
        return dirname(resolve(this.expandHome(path)));
    }

    public getParents(
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

    public getName(
        path: TFilePath,
        extension?: TFileExtension,
    ): TFileName {
        return basename(this.expandHome(path), extension);
    }

    public getExtension(path: TFilePath): TFileExtension {
        return extname(this.expandHome(path));
    }

    public isFileSystemRoot(path: TPath): boolean {
        const absPath = resolve(this.expandHome(path));
        return absPath === dirname(absPath);
    }

    public join(...segments: string[]): TPath {
        // Map over segments to expand a tilde if it forms the beginning of the joined path
        const expandedSegments = segments.map((segment, index) => {
            return index === 0 ? this.expandHome(segment) : segment;
        });
        return join(...expandedSegments);
    }

    public normalize(path: TPath): TPath {
        return normalize(this.expandHome(path));
    }
    private expandHome(path: string): string {
        return path.replace(/^~(?=$|\/|\\)/, homedir());
    }
}

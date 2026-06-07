import type { IConfig } from "../types/Config.js";
import type { TDirectoryPath, TFilePath } from "../types/PathTypes.js";
import { Result, type TResult } from "../types/Result.js";
import type { ISpace } from "../types/Space.js";
import { ConfigService } from "./ConfigService.js";
import { FileService } from "./fs/FileService.js";
import { PathService } from "./fs/PathService.js";
import { JsonService } from "./JsonService.js";
import { LoggerService } from "./LoggerService.js";

export class SpaceService {
    public static async getActivePath(): Promise<TFilePath> {
        const config: IConfig = await ConfigService.get();
        return config.active.path;
    }

    public static async getSpacesPaths(): Promise<TDirectoryPath[]> {
        // Generate candidate directories up to the root directory
        const candidatePaths: TDirectoryPath[] = PathService.getParents(
            PathService.getCurrentWorkingDirectory(),
            { includeCurrentWorkingDirectory: true },
        ).flatMap((path) => [
            PathService.join(path, "spaces"),
            PathService.join(path, ".space/spaces"),
        ]);

        // Filter to only those which exist
        const spacesPaths: TDirectoryPath[] = [];
        for (const path of candidatePaths) {
            if (await FileService.exists(path)) {
                spacesPaths.push(path);
            }
        }

        return spacesPaths;
    }

    public static async getActive(): Promise<ISpace | undefined> {
        const activePath: TFilePath = await this.getActivePath();

        if (!(await FileService.exists(activePath))) {
            await this.create("default");
            return undefined;
        }

        const space: TResult<ISpace, string> =
            await JsonService.load(activePath);
        if (space.isError()) {
            throw new Error(
                `Failed to load active space - ${space.getError()}`,
            );
        }

        return space.getValue()!;
    }

    public static async create(name: string): Promise<ISpace> {
        const config: IConfig = await ConfigService.get();

        // Check if a space with the same name already exists
        const existingSpace: ISpace | undefined = await this.get(name);
        if (existingSpace !== undefined) {
            LoggerService.warn(`Space '${name}' already exists`);
            return existingSpace;
        }

        // Ensure base directory exists
        await FileService.makeDirectory("~/.space/spaces");

        // Get the "most local" spaces directory to add to
        const spacesPath: TDirectoryPath | undefined = (
            await this.getSpacesPaths()
        ).at(1);
        if (spacesPath === undefined) {
            throw new Error(
                "Failed to find any candidate spaces directories - this should never happen\nDoes ~/.space/spaces exist?",
            );
        }

        // The path to the code-workspace file about to be created
        const spacePath: TFilePath = PathService.join(
            spacesPath,
            `${name}.code-workspace`,
        );

        // Generate the new space file
        const spaceContent: ISpace = {
            folders: [],
            settings: {
                "window.title": `\${dirty}\${activeEditorShort} - ${name} (Space)`,
            },
            space: {
                attachedFiles: [config.active.path],
            },
        };

        await JsonService.save(spacePath, spaceContent);

        // Ensure that the generated space can be located
        const generatedSpace: ISpace | undefined = await this.get(name);
        if (generatedSpace === undefined) {
            throw new Error(
                `Failed to locate the generated space '${name}' after creation`,
            );
        }

        return generatedSpace;
    }

    public static async use(name: string): Promise<TResult<ISpace, string>> {
        // Find the new space
        const newSpace: ISpace | undefined = await this.get(name);
        if (newSpace === undefined) {
            return Result.error(`No space with name '${name}' exists!`);
        }

        // Find active space
        const activeSpace: ISpace | undefined = await this.getActive();
        if (activeSpace !== undefined) {
            if (activeSpace.space?.name === undefined) {
                return Result.error(
                    "No name present under '.space.name' in active workspace file",
                );
            }

            // Backup the active space before overwriting it
            const oldSpacePath: string | undefined = activeSpace.space?.path;
            if (oldSpacePath === undefined) {
                return Result.error(
                    "Active workspace does not have a '.space.path' field",
                );
            }

            await JsonService.save(oldSpacePath, activeSpace);
        }

        // Overwrite the active space file with the new space content
        await JsonService.save(await this.getActivePath(), newSpace);

        return Result.success(newSpace);
    }

    public static async exists(name: string): Promise<boolean> {
        return (await this.get(name)) !== undefined;
    }

    public static async get(name: string): Promise<ISpace | undefined> {
        const spaces: ISpace[] = await this.list();

        const space: ISpace | undefined = spaces.find(
            (space: ISpace): boolean => space.space?.name === name,
        );

        return space;
    }

    public static async list(): Promise<ISpace[]> {
        const spacesPaths: TDirectoryPath[] = await this.getSpacesPaths();

        const spaces: ISpace[] = [];
        for (const spacesPath of spacesPaths) {
            const spacePaths: TFilePath[] =
                (await FileService.listFiles(spacesPath)).getValue() ?? [];

            for (const spacePath of spacePaths) {
                const result: TResult<ISpace, string> =
                    await JsonService.load(spacePath);

                if (result.isError()) {
                    LoggerService.warn(
                        `Failed to load space at '${spacePath}' - ${result.getError()}`,
                    );
                    continue;
                }

                const space: ISpace = result.getValue()!;

                // Set default space config
                if (space.space === undefined) {
                    space.space = {};
                }

                if (space.space.name === undefined) {
                    space.space.name = PathService.getName(
                        spacePath,
                        PathService.getExtension(spacePath),
                    );
                }

                if (space.space.path === undefined) {
                    space.space.path = spacePath;
                }

                // Ensure the updated defaults are persisted
                JsonService.save(space.space.path, space);

                spaces.push(space);
            }
        }

        return spaces;
    }

    public static async delete(
        name: string,
    ): Promise<TResult<boolean, string>> {
        const space: ISpace | undefined = await this.get(name);

        // Does the space exist?
        if (space === undefined) {
            LoggerService.warn(`Nothing to delete, '${name}' does not exist`);
            return Result.success(false);
        }

        // Does the space have a path?
        if (space.space?.path === undefined) {
            return Result.error(
                `Space '${name}' does not have an associated '.space.path'`,
            );
        }

        // Is the space active?
        const activeSpace: ISpace | undefined = await this.getActive();
        if (
            activeSpace !== undefined &&
            space.space?.path === activeSpace.space?.path
        ) {
            LoggerService.warn(
                `Skipping deletion as the space '${name}' is currently active`,
            );
            return Result.success(false);
        }

        // Safe to delete
        await FileService.delete(space.space.path);
        return Result.success(true);
    }
}

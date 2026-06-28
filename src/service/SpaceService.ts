import type { IConfig } from "../types/Config.js";
import type { TDirectoryPath, TFilePath, TPath } from "../types/PathTypes.js";
import { Result, type TResult } from "../types/Result.js";
import type { ILoadedSpace, ISavedSpace } from "../types/Space.js";
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

    public static async getActive(): Promise<ILoadedSpace | undefined> {
        const activePath: TFilePath = await this.getActivePath();

        if (!(await FileService.exists(activePath))) {
            await this.create("default");
            return undefined;
        }

        const result: TResult<ISavedSpace, string> =
            await JsonService.load(activePath);
        if (result.isError()) {
            throw new Error(
                `Failed to load active space - ${result.getError()}`,
            );
        }

        const space: ISavedSpace = result.getValue()!;
        return this.toLoadedSpace(space, activePath);
    }

    public static async create(name: string): Promise<ILoadedSpace> {
        const config: IConfig = await ConfigService.get();

        // Check if a space with the same name already exists
        const existingSpace: ILoadedSpace | undefined = await this.get(name);
        if (existingSpace !== undefined) {
            LoggerService.warn(`Space '${name}' already exists`);
            return existingSpace;
        }

        // Ensure base directory exists
        await FileService.createDirectory("~/.space/spaces");

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
        const spaceContent: ISavedSpace = {
            folders: [],
            settings: {
                "window.title": `\${dirty}\${activeEditorShort} - ${name} (Space)`,
            },
            space: {
                attachedFiles: [config.active.path],
            },
        };

        const loadedSpace: ILoadedSpace = this.toLoadedSpace(
            spaceContent,
            spacePath,
        );

        // Ensure all default space values are set
        await this.save(loadedSpace)

        await JsonService.save(spacePath, spaceContent);

        // Ensure that the generated space can be located
        const generatedSpace: ILoadedSpace | undefined = await this.get(name);
        if (generatedSpace === undefined) {
            throw new Error(
                `Failed to locate the generated space '${name}' after creation`,
            );
        }

        if (generatedSpace.space.path !== spacePath) {
            throw new Error(
                `Generated space was not located at '${spacePath}'`,
            );
        }

        return generatedSpace;
    }

    public static async use(
        name: string,
    ): Promise<TResult<ILoadedSpace, string>> {
        // Find the new space
        const newSpace: ILoadedSpace | undefined = await this.get(name);
        if (newSpace === undefined) {
            return Result.error(`No space with name '${name}' exists!`);
        }

        // Find active space
        const activeSpace: ILoadedSpace | undefined = await this.getActive();
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

    public static async get(name: string): Promise<ILoadedSpace | undefined> {
        const spaces: ILoadedSpace[] = await this.list();

        const space: ILoadedSpace | undefined = spaces.find(
            (space: ILoadedSpace): boolean => space.space?.name === name,
        );

        return space;
    }

    public static async list(): Promise<ILoadedSpace[]> {
        const spacesPaths: TDirectoryPath[] = await this.getSpacesPaths();

        const spaces: ILoadedSpace[] = [];
        for (const spacesPath of spacesPaths) {
            const spacePaths: TFilePath[] =
                (await FileService.listFiles(spacesPath)).getValue() ?? [];

            for (const spacePath of spacePaths) {
                const result: TResult<ISavedSpace, string> =
                    await JsonService.load(spacePath);

                if (result.isError()) {
                    LoggerService.warn(
                        `Failed to load space at '${spacePath}' - ${result.getError()}`,
                    );
                    continue;
                }

                const savedSpace: ISavedSpace = result.getValue()!;

                // Convert to the loaded variant so the tool knows where it came from
                const loadedSpace: ILoadedSpace = this.toLoadedSpace(
                    savedSpace,
                    spacePath,
                );

                await this.save(loadedSpace)

                spaces.push(loadedSpace);
            }
        }

        return spaces;
    }

    public static async delete(
        name: string,
    ): Promise<TResult<boolean, string>> {
        const space: ILoadedSpace | undefined = await this.get(name);

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
        const activeSpace: ILoadedSpace | undefined = await this.getActive();
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

    private static async save(space: ILoadedSpace): Promise<void> {
        // Set default space config
        const savedSpace: ISavedSpace = this.toSavedSpace(space, space.space.path);

        await JsonService.save(space.space.path, savedSpace);
    }

    private static toSavedSpace(
        loadedSpace: ILoadedSpace | ISavedSpace,
        path: TFilePath,
    ): ISavedSpace {
        const savedSpace: ISavedSpace = structuredClone(loadedSpace);

        if (savedSpace.space === undefined) {
            savedSpace.space = {};
        }

        if (savedSpace.space.name === undefined) {
            savedSpace.space.name = PathService.getName(
                path,
                PathService.getExtension(path),
            );
        }

        if (savedSpace.space.path !== undefined) {
            savedSpace.space.path = undefined;
        }

        return savedSpace;
    }

    private static toLoadedSpace(
        space: ISavedSpace,
        path: TFilePath,
    ): ILoadedSpace {
        // This creates a copy of the input space and ensures default values are set
        space = this.toSavedSpace(space, path);

        // The path to the saved space is required when a space is active, as this
        // enables `space` to know where to save the active space to
        if (space?.space !== undefined && space?.space?.path === undefined) {
            space.space.path = path;
        }

        return space as ILoadedSpace;
    }
}

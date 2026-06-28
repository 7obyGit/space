import { inject, singleton } from "tsyringe";
import type { IConfig } from "../types/Config.js";
import type { TDirectoryPath, TFilePath } from "../types/PathTypes.js";
import { Result, type TResult } from "../types/Result.js";
import type { ILoadedSpace, ISavedSpace } from "../types/Space.js";
import { ConfigService } from "./ConfigService.js";
import { FileService } from "./fs/FileService.js";
import { PathService } from "./fs/PathService.js";
import { JsonService } from "./JsonService.js";
import { LoggerService } from "./LoggerService.js";

@singleton()
export class SpaceService {
    constructor(
        @inject(ConfigService) private configService: ConfigService,
        @inject(FileService) private fileService: FileService,
        @inject(PathService) private pathService: PathService,
        @inject(JsonService) private jsonService: JsonService,
        @inject(LoggerService) private loggerService: LoggerService,
    ) {}

    public async getActivePath(): Promise<TFilePath> {
        const config: IConfig = await this.configService.get();
        return config.active.path;
    }

    public async getSpacesPaths(): Promise<TDirectoryPath[]> {
        // Generate candidate directories up to the root directory
        const candidatePaths: TDirectoryPath[] = this.pathService
            .getParents(this.pathService.getCurrentWorkingDirectory(), {
                includeCurrentWorkingDirectory: true,
            })
            .flatMap((path) => [
                this.pathService.join(path, "spaces"),
                this.pathService.join(path, ".space/spaces"),
            ]);

        // Filter to only those which exist
        const spacesPaths: TDirectoryPath[] = [];
        for (const path of candidatePaths) {
            if (await this.fileService.exists(path)) {
                spacesPaths.push(path);
            }
        }

        return spacesPaths;
    }

    public async getActive(): Promise<ILoadedSpace | undefined> {
        const activePath: TFilePath = await this.getActivePath();

        if (!(await this.fileService.exists(activePath))) {
            await this.create("default");
            return undefined;
        }

        const result: TResult<ISavedSpace, string> =
            await this.jsonService.load(activePath);
        if (result.isError()) {
            throw new Error(
                `Failed to load active space - ${result.getError()}`,
            );
        }

        const space: ISavedSpace = result.getValue()!;
        return this.toLoadedSpace(space, activePath);
    }

    public async create(name: string): Promise<ILoadedSpace> {
        const config: IConfig = await this.configService.get();

        // Check if a space with the same name already exists
        const existingSpace: ILoadedSpace | undefined = await this.get(name);
        if (existingSpace !== undefined) {
            this.loggerService.warn(`Space '${name}' already exists`);
            return existingSpace;
        }

        // Ensure base directory exists
        await this.fileService.createDirectory("~/.space/spaces");

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
        const spacePath: TFilePath = this.pathService.join(
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
        await this.save(loadedSpace);

        await this.jsonService.save(spacePath, spaceContent);

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

    public async use(
        nameOrPath: string,
    ): Promise<TResult<ILoadedSpace, string>> {
        // Find the new space
        let newSpace: ILoadedSpace | undefined = await this.get(nameOrPath);

        if (newSpace === undefined) {
            // Try to load as a path
            const absolutePath = this.pathService.toAbsolute(nameOrPath);
            if (await this.fileService.exists(absolutePath)) {
                const result: TResult<ISavedSpace, string> =
                    await this.jsonService.load(absolutePath);

                if (result.isSuccess()) {
                    newSpace = this.toLoadedSpace(
                        result.getValue()!,
                        absolutePath,
                    );
                }
            }
        }

        if (newSpace === undefined) {
            return Result.error(
                `No space with name or path '${nameOrPath}' exists!`,
            );
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

            await this.jsonService.save(oldSpacePath, activeSpace);
        }

        // Overwrite the active space file with the new space content
        await this.jsonService.save(await this.getActivePath(), newSpace);

        return Result.success(newSpace);
    }

    public async exists(name: string): Promise<boolean> {
        return (await this.get(name)) !== undefined;
    }

    public async get(name: string): Promise<ILoadedSpace | undefined> {
        const spaces: ILoadedSpace[] = await this.list();

        const space: ILoadedSpace | undefined = spaces.find(
            (s: ILoadedSpace): boolean => s.space?.name === name,
        );

        return space;
    }

    public async list(): Promise<ILoadedSpace[]> {
        const spacesPaths: TDirectoryPath[] = await this.getSpacesPaths();

        const spaces: ILoadedSpace[] = [];
        for (const spacesPath of spacesPaths) {
            const spacePaths: TFilePath[] =
                (await this.fileService.listFiles(spacesPath)).getValue() ?? [];

            for (const spacePath of spacePaths) {
                const result: TResult<ISavedSpace, string> =
                    await this.jsonService.load(spacePath);

                if (result.isError()) {
                    this.loggerService.warn(
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

                await this.save(loadedSpace);

                spaces.push(loadedSpace);
            }
        }

        return spaces;
    }

    public async delete(name: string): Promise<TResult<boolean, string>> {
        const space: ILoadedSpace | undefined = await this.get(name);

        // Does the space exist?
        if (space === undefined) {
            this.loggerService.warn(
                `Nothing to delete, '${name}' does not exist`,
            );
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
            this.loggerService.warn(
                `Skipping deletion as the space '${name}' is currently active`,
            );
            return Result.success(false);
        }

        // Safe to delete
        await this.fileService.delete(space.space.path);
        return Result.success(true);
    }

    public async saveLoadedSpace(space: ILoadedSpace): Promise<void> {
        // Save to original path
        const savedSpace: ISavedSpace = this.toSavedSpace(
            space,
            space.space.path,
        );
        await this.jsonService.save(space.space.path, savedSpace);

        // Save to active path
        const activePath = await this.getActivePath();
        await this.jsonService.save(activePath, space);
    }

    public async addFolderToActive(
        folderPath?: string,
    ): Promise<TResult<void, string>> {
        const active = await this.getActive();
        if (!active) {
            return Result.error("No active space found");
        }

        const targetPath = folderPath
            ? this.pathService.toAbsolute(folderPath)
            : this.pathService.getCurrentWorkingDirectory();

        // Ensure folders is initialized
        if (!active.folders) {
            active.folders = [];
        }

        active.folders.unshift({ path: targetPath });

        await this.saveLoadedSpace(active);
        return Result.success(undefined);
    }

    public async removeFolderFromActive(
        folderPath?: string,
    ): Promise<TResult<void, string>> {
        const active = await this.getActive();
        if (!active) {
            return Result.error("No active space found");
        }

        const targetPath = folderPath
            ? this.pathService.toAbsolute(folderPath)
            : this.pathService.getCurrentWorkingDirectory();

        if (!active.folders) {
            return Result.success(undefined);
        }

        active.folders = active.folders.filter((f) => {
            const p = (f as any).path || (f as any).uri;
            return p !== targetPath;
        });

        await this.saveLoadedSpace(active);
        return Result.success(undefined);
    }

    public async popFolderFromActive(): Promise<TResult<void, string>> {
        const active = await this.getActive();
        if (!active) {
            return Result.error("No active space found");
        }

        if (!active.folders || active.folders.length === 0) {
            return Result.error("No folders to pop");
        }

        active.folders.shift();

        await this.saveLoadedSpace(active);
        return Result.success(undefined);
    }

    private async save(space: ILoadedSpace): Promise<void> {
        // Set default space config
        const savedSpace: ISavedSpace = this.toSavedSpace(
            space,
            space.space.path,
        );

        await this.jsonService.save(space.space.path, savedSpace);
    }

    private toSavedSpace(
        loadedSpace: ILoadedSpace | ISavedSpace,
        path: TFilePath,
    ): ISavedSpace {
        const savedSpace: ISavedSpace = structuredClone(loadedSpace);

        if (savedSpace.space === undefined) {
            savedSpace.space = {};
        }

        if (savedSpace.space.name === undefined) {
            savedSpace.space.name = this.pathService.getName(
                path,
                this.pathService.getExtension(path),
            );
        }

        if (savedSpace.space.path !== undefined) {
            savedSpace.space.path = undefined;
        }

        return savedSpace;
    }

    private toLoadedSpace(space: ISavedSpace, path: TFilePath): ILoadedSpace {
        const spacePath = space.space?.path;

        // This creates a copy of the input space and ensures default values are set
        space = this.toSavedSpace(space, path);

        // The path to the saved space is required when a space is active, as this
        // enables `space` to know where to save the active space to
        if (space?.space !== undefined) {
            space.space.path = spacePath ?? path;
        }

        return space as ILoadedSpace;
    }
}

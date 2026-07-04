import { aw } from "@7obygit/aw";
import { inject, singleton } from "tsyringe";
import type { IConfig } from "../types/Config.js";
import type { TDirectoryPath, TFilePath } from "../types/PathTypes.js";
import { Result, type TResult } from "../types/Result.js";
import type { ILoadedSpace, ISavedSpace } from "../types/Space.js";
import { ConfigService } from "./ConfigService.js";
import { FileService } from "./fs/FileService.js";
import { LinkService } from "./fs/LinkService.js";
import { PathService } from "./fs/PathService.js";
import { JsonService } from "./JsonService.js";
import { LoggerService } from "./LoggerService.js";
import { TerminalService } from "./TerminalService.js";
import { GitService } from "./GitService.js";

@singleton()
export class SpaceService {
    constructor(
        @inject(ConfigService) private configService: ConfigService,
        @inject(FileService) private fileService: FileService,
        @inject(LinkService) private linkService: LinkService,
        @inject(PathService) private pathService: PathService,
        @inject(JsonService) private jsonService: JsonService,
        @inject(LoggerService) private loggerService: LoggerService,
        @inject(TerminalService) private terminalService: TerminalService,
        @inject(GitService) private gitService: GitService,
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
        const loadedSpace = await this.toLoadedSpace(space, activePath);

        await this.syncAttachedFiles(loadedSpace);

        return loadedSpace;
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
                attachedFiles: [
                    this.pathService.toAbsolute(config.active.path),
                ],
                lastUpdated: new Date().toISOString(),
            },
        };

        const loadedSpace: ILoadedSpace = await this.toLoadedSpace(
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

    public async init(): Promise<ILoadedSpace> {
        const cwd = this.pathService.getCurrentWorkingDirectory();
        const name = this.pathService.getName(cwd);
        const config: IConfig = await this.configService.get();

        // Ensure .space/spaces directory exists in current directory
        const spacesPath = this.pathService.join(cwd, ".space/spaces");
        await this.fileService.createDirectory(spacesPath);

        // The path to the code-workspace file about to be created
        const spacePath: TFilePath = this.pathService.join(
            spacesPath,
            `${name}.code-workspace`,
        );

        // Generate the new space file
        const spaceContent: ISavedSpace = {
            folders: [{ path: cwd }],
            settings: {
                "window.title": `\${dirty}\${activeEditorShort} - ${name} (Space)`,
            },
            space: {
                attachedFiles: [
                    this.pathService.toAbsolute(config.active.path),
                ],
                lastUpdated: new Date().toISOString(),
            },
        };

        const loadedSpace: ILoadedSpace = await this.toLoadedSpace(
            spaceContent,
            spacePath,
        );

        // Ensure all default space values are set
        await this.save(loadedSpace);

        await this.jsonService.save(spacePath, spaceContent);

        return loadedSpace;
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
                    newSpace = await this.toLoadedSpace(
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
            // Run close script if it exists
            await this.runScript("close", {
                silent: true,
                space: activeSpace,
            });

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

            const savedActiveSpace = await this.toSavedSpace(
                activeSpace,
                oldSpacePath as TFilePath,
            );

            if (savedActiveSpace.space === undefined) {
                savedActiveSpace.space = {};
            }

            savedActiveSpace.space.lastUpdated = new Date().toISOString();
            await this.jsonService.save(oldSpacePath, savedActiveSpace);
        }

        // Sync attached files for the new space
        await this.syncAttachedFiles(newSpace);

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
                const loadedSpace: ILoadedSpace = await this.toLoadedSpace(
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
        space.space.lastUpdated = new Date().toISOString();
        await this.syncAttachedFiles(space);

        // Save to original path
        const savedSpace: ISavedSpace = await this.toSavedSpace(
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

        if (await this.fileService.isFile(targetPath)) {
            if (!active.space.attachedFiles) {
                active.space.attachedFiles = [];
            }
            if (!active.space.attachedFiles.includes(targetPath as TFilePath)) {
                active.space.attachedFiles.push(targetPath as TFilePath);
            }
        } else {
            // Ensure folders is initialized
            if (!active.folders) {
                active.folders = [];
            }

            active.folders.unshift({ path: targetPath });
        }

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

        if (active.folders) {
            active.folders = active.folders.filter((f) => {
                const p = (f as any).path || (f as any).uri;
                return p !== targetPath;
            });
        }

        if (active.space.attachedFiles) {
            active.space.attachedFiles = active.space.attachedFiles.filter(
                (f) => f !== targetPath,
            );
        }

        await this.saveLoadedSpace(active);
        return Result.success(undefined);
    }

    public async getEnv(space: ILoadedSpace): Promise<Record<string, string>> {
        const resolvedEnv: Record<string, string> = {
            ...process.env,
        } as Record<string, string>;
        const env = space.space.env || {};

        for (const [key, value] of Object.entries(env)) {
            if (typeof value === "string") {
                resolvedEnv[key] = value;
            } else if (
                typeof value === "object" &&
                value !== null &&
                "command" in value
            ) {
                const result = await this.terminalService.run(value.command);
                if (result.isSuccess()) {
                    const terminalResult = result.getValue()!;
                    if (terminalResult.exitCode === 0) {
                        resolvedEnv[key] = terminalResult.stdout.trim();
                    } else {
                        this.loggerService.error(
                            `Failed to resolve env var ${key}: command exited with code ${terminalResult.exitCode}\n${terminalResult.stderr}`,
                        );
                        resolvedEnv[key] = "";
                    }
                } else {
                    this.loggerService.error(
                        `Failed to resolve env var ${key}: ${result.getError()}`,
                    );
                    resolvedEnv[key] = "";
                }
            }
        }

        return resolvedEnv;
    }

    public async runScript(
        scriptName: string,
        options: { silent?: boolean; space?: ILoadedSpace } = {},
    ): Promise<void> {
        const active = options.space ?? (await this.getActive());
        if (!active) {
            if (!options.silent) {
                this.loggerService.error("No active space found");
            }
            return;
        }

        const script = active.space.scripts?.[scriptName];
        if (!script) {
            if (!options.silent) {
                this.loggerService.warn(
                    `No script named '${scriptName}' found in active space`,
                );
            }
            return;
        }

        const env = await this.getEnv(active);

        if (typeof script === "string") {
            this.loggerService.info(`Running script: ${scriptName}`);
            await aw.exec(script, env);
        } else {
            if (script["pre-command"]) {
                this.loggerService.info(
                    `Running pre-command for script: ${scriptName}`,
                );
                await aw.exec(script["pre-command"], env);
            }
            if (script["command"]) {
                this.loggerService.info(`Running script: ${scriptName}`);
                await aw.exec(script["command"], env);
            }
            if (script["post-command"]) {
                this.loggerService.info(
                    `Running post-command for script: ${scriptName}`,
                );
                await aw.exec(script["post-command"], env);
            }
        }
    }

    public async runHook(
        scriptName: string,
        hookType: "pre-command" | "command" | "post-command",
    ): Promise<void> {
        const active = await this.getActive();
        if (!active) {
            return;
        }

        const script = active.space.scripts?.[scriptName];
        if (!script) {
            return;
        }

        let hookCommand: string | undefined;
        if (typeof script === "string") {
            if (hookType === "command") {
                hookCommand = script;
            }
        } else {
            hookCommand = script[hookType];
        }

        if (hookCommand) {
            const env = await this.getEnv(active);
            this.loggerService.info(`Running ${hookType} hook: ${scriptName}`);
            await aw.exec(hookCommand, env);
        }
    }

    private getProjectRoot(spaceFilePath: TFilePath): TDirectoryPath | undefined {
        const absolutePath = this.pathService.toAbsolute(spaceFilePath);
        const parts = absolutePath.split(/[/\\]/);

        const dotSpaceIndex = parts.lastIndexOf(".space");
        if (dotSpaceIndex !== -1) {
            return (parts.slice(0, dotSpaceIndex).join("/") || "/") as TDirectoryPath;
        }

        const spacesIndex = parts.lastIndexOf("spaces");
        if (spacesIndex !== -1) {
            return (parts.slice(0, spacesIndex).join("/") || "/") as TDirectoryPath;
        }

        return undefined;
    }

    private async syncAttachedFiles(space: ILoadedSpace): Promise<void> {
        const attachedFiles = space.space.attachedFiles || [];

        const spaceName = space.space.name;
        const tmpDir = `/tmp/space/${spaceName}` as TDirectoryPath;

        if (attachedFiles.length === 0) {
            // Remove "Attached Files" folder if it exists
            if (space.folders) {
                space.folders = space.folders.filter(
                    (f) => (f as any).name !== "Attached Files",
                );
            }
            // Cleanup tmp dir if it exists
            if (await this.fileService.exists(tmpDir)) {
                await this.fileService.delete(tmpDir);
            }
            return;
        }

        // Ensure tmpDir exists and is empty
        if (await this.fileService.exists(tmpDir)) {
            await this.fileService.delete(tmpDir);
        }
        await this.fileService.createDirectory(tmpDir);

        for (const filePath of attachedFiles) {
            const absoluteFilePath = this.pathService.toAbsolute(filePath);
            const fileName = this.pathService.getName(absoluteFilePath);
            const linkPath = this.pathService.join(tmpDir, fileName);
            await this.linkService.create({
                from: linkPath,
                to: absoluteFilePath,
            });
        }

        // Ensure "Attached Files" folder is in space.folders
        if (!space.folders) {
            space.folders = [];
        }

        const attachedFilesFolder = space.folders.find(
            (f) => (f as any).name === "Attached Files",
        );
        if (attachedFilesFolder) {
            (attachedFilesFolder as any).path = tmpDir;
        } else {
            space.folders.push({ path: tmpDir, name: "Attached Files" });
        }
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
        const savedSpace: ISavedSpace = await this.toSavedSpace(
            space,
            space.space.path,
        );

        await this.jsonService.save(space.space.path, savedSpace);
    }

    private async toSavedSpace(
        loadedSpace: ILoadedSpace | ISavedSpace,
        path: TFilePath,
    ): Promise<ISavedSpace> {
        const savedSpace: ISavedSpace = structuredClone(loadedSpace);
        const baseDir = this.pathService.getParent(path);
        const projectRoot = this.getProjectRoot(path);

        const shouldBeRelative = async (targetPath: string): Promise<boolean> => {
            if (!this.pathService.isAbsolute(targetPath)) {
                return true;
            }

            // 1. Same git repo?
            if (await this.gitService.isSameRepo(path, targetPath)) {
                return true;
            }

            // 2. Beneath project root?
            if (projectRoot) {
                const relative = this.pathService.toRelative(projectRoot, targetPath);
                if (!relative.startsWith("..") && !this.pathService.isAbsolute(relative)) {
                    return true;
                }
            }

            return false;
        };

        if (savedSpace.folders) {
            const folders = [];
            for (const f of savedSpace.folders) {
                if ((f as any).name === "Attached Files") {
                    continue;
                }

                const folder = f as any;
                if (folder.path && this.pathService.isAbsolute(folder.path)) {
                    if (await shouldBeRelative(folder.path)) {
                        folder.path = this.pathService.toRelative(baseDir, folder.path);
                    }
                }
                folders.push(f);
            }
            savedSpace.folders = folders;
        }

        if (savedSpace.space === undefined) {
            savedSpace.space = {};
        }

        if (savedSpace.space.attachedFiles) {
            const attachedFiles = [];
            for (const f of savedSpace.space.attachedFiles) {
                if (this.pathService.isAbsolute(f)) {
                    if (await shouldBeRelative(f)) {
                        attachedFiles.push(this.pathService.toRelative(baseDir, f) as TFilePath);
                        continue;
                    }
                }
                attachedFiles.push(f);
            }
            savedSpace.space.attachedFiles = attachedFiles;
        }

        if (savedSpace.space.name === undefined) {
            savedSpace.space.name = this.pathService.getName(
                path,
                this.pathService.getExtension(path),
            );
        }

        if (savedSpace.space.path !== undefined) {
            delete savedSpace.space.path;
        }

        if (savedSpace.space.env === undefined) {
            savedSpace.space.env = {};
        }

        if (savedSpace.space.scripts === undefined) {
            savedSpace.space.scripts = {};
        }

        if (savedSpace.space.lastUpdated === undefined) {
            savedSpace.space.lastUpdated = new Date().toISOString();
        }

        return savedSpace;
    }

    private async toLoadedSpace(
        space: ISavedSpace,
        path: TFilePath,
    ): Promise<ILoadedSpace> {
        const spacePath = space.space?.path;
        const baseDir = this.pathService.getParent(path);

        // This creates a copy of the input space and ensures default values are set
        space = await this.toSavedSpace(space, path);

        if (space.folders) {
            for (const folder of space.folders) {
                const f = folder as any;
                if (f.path) {
                    f.path = this.pathService.toAbsolute(f.path, baseDir);
                }
            }
        }

        if (space.space?.attachedFiles) {
            space.space.attachedFiles = space.space.attachedFiles.map((f) =>
                this.pathService.toAbsolute(f, baseDir),
            );
        }

        // The path to the saved space is required when a space is active, as this
        // enables `space` to know where to save the active space to
        if (space?.space !== undefined) {
            space.space.path = spacePath ?? path;
        }

        return space as ILoadedSpace;
    }
}

import type { TFilePath } from "./PathTypes.js";

export interface ISavedSpace extends IVSCodeWorkspace {
    space?: {
        name?: string;
        path?: string;
        lastUpdated?: string;
        attachedFiles?: TFilePath[];
        env?: ISpaceEnv;
    };
}

export interface ILoadedSpace extends IVSCodeWorkspace {
    space: {
        name: string;
        path: string;
        lastUpdated: string;
        attachedFiles: TFilePath[];
        env: ISpaceEnv;
    };
}

export interface ISpaceEnv {
    [key: string]: string | { command: string };
}

/**
 * Represents a standard VS Code workspace configuration file (.code-workspace).
 * Based on the official VS Code JSON schema.
 */
export interface IVSCodeWorkspace {
    /**
     * The list of folders included in the workspace.
     * Can be absolute paths, relative paths, or URI schemes.
     */
    folders: TWorkspaceFolder[];

    /**
     * Workspace-specific settings that override user settings.
     * Matches the standard VS Code settings key-value pair structure.
     */
    settings?: Record<string, any>;

    /**
     * Workspace-specific launch configurations for debugging.
     */
    launch?: {
        version: string;
        configurations: Array<Record<string, any>>;
        compounds?: Array<Record<string, any>>;
    };

    /**
     * Workspace-specific task configurations.
     */
    tasks?: {
        version: string;
        tasks: Array<Record<string, any>>;
        inputs?: Array<Record<string, any>>;
    };

    /**
     * Workspace-specific extension recommendations and unwanted extensions.
     */
    extensions?: IWorkspaceExtensions;

    /**
     * Remote authority information when working in a remote context.
     */
    remoteAuthority?: string;

    /**
     * Transient workspace metadata, usually managed by VS Code.
     */
    transient?: boolean;
}

export type TWorkspaceFolder = IPathFolder | IUriFolder | INamedFolder;

export interface IPathFolder {
    /**
     * A relative path (to the .code-workspace file) or an absolute path to a folder.
     */
    path: string;
    /**
     * An optional custom name to display for this folder in the Explorer.
     */
    name?: string;
}

export interface IUriFolder {
    /**
     * A remote or virtual URI path (e.g., "ssh-remote://...", "vscode-vfs://...").
     */
    uri: string;
    /**
     * An optional custom name to display for this folder in the Explorer.
     */
    name?: string;
}

export interface INamedFolder {
    path?: string;
    uri?: string;
    /**
     * The explicit custom name for the workspace folder.
     */
    name: string;
}

export interface IWorkspaceExtensions {
    /**
     * Array of extension IDs (publisher.name) recommended for users of this workspace.
     */
    recommendations?: string[];

    /**
     * Array of extension IDs (publisher.name) that are not recommended for this workspace.
     */
    unwantedRecommendations?: string[];
}

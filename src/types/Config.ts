import type { TFilePath, TPath } from "./PathTypes.js";

export type TVersion = `v${number}.${number}.${number}`;
export type TViewType = IWorkspaceFileView | IFolderView;

export interface IWorkspaceFileView {
    type: "Workspace";
}

export interface IFolderView {
    type: "Folder";
    path: TPath;
}

export interface IConfig {
    version: TVersion;
    active: {
        path: TFilePath;
    };
    view: TViewType;
}

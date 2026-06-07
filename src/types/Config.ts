import type { TPath } from "./PathTypes.js";

export type TVersion = `v${number}.${number}.${number}`;
export type TViewType = "Workspace File" | "Folder";

export interface IConfig {
    version: TVersion;
    view: { type: TViewType; path: TPath };
}

import type { IConfig } from "../types/Config.js";
import { Result, type TResult } from "../types/Result.js";
import { ConfigService } from "./ConfigService.js";

export class ViewService {
    public static async refresh(): Promise<TResult<boolean, string>> {
        const config: IConfig = await ConfigService.get();

        switch (config.view.type) {
            case "Folder":
                this.refreshFolderView();
                break;
            case "Workspace":
                this.refreshWorkspaceView();
                break;
            default:
                throw new Error(`Unknown view type '${config.view}'`);
        }

        return Result.success(true);
    }

    private static async refreshFolderView(): Promise<
        TResult<boolean, string>
    > {
        // TODO: Implement this
        // This view assumes the user has a folder open in VSCode
        // - "view directory" is symlink to "backing directory"
        // On refresh:
        // - "backing directory" is deleted
        // - Active workspace is read, folders and attached files identified
        // - if single folder, backing directory is symlink to that directory
        // - if multiple, backing directory is real directory, containing symlinks to each directory

        throw new Error("Not implemented - refreshFolderView");
    }

    private static async refreshWorkspaceView(): Promise<
        TResult<boolean, string>
    > {
        // Workspace view uses the open VSCode workspace file - no tweaks needed
        return Result.success(true);
    }
}

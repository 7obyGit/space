import type { IConfig } from "../types/Config.js";
import type { TDirectoryPath } from "../types/PathTypes.js";
import { Result, type TResult } from "../types/Result.js";
import { AppService } from "./AppService.js";
import { FileService } from "./fs/FileService.js";
import { PathService } from "./fs/PathService.js";
import { JsonService } from "./JsonService.js";
import { LoggerService } from "./LoggerService.js";

export class ConfigService {
    private static config?: IConfig;

    public static async getConfig(): Promise<IConfig> {
        if (this.config === undefined) {
            const result: TResult<IConfig, string> = await this.load();
            if (result.isError()) {
                throw new Error(`Failed to load config - ${result.getError()}`);
            }

            this.config = result.getValue()!;
        }

        return this.config;
    }

    private static getUserConfigPath(): string {
        return PathService.toAbsolute("~/.space/config.json");
    }

    private static async load(): Promise<TResult<IConfig, string>> {
        // Locate all config
        const configPaths: TDirectoryPath[] = await this.getConfigPaths();

        // If no locations found, generate default config
        if (configPaths.length === 0) {
            this.createDefaultConfig();
            configPaths.push(this.getUserConfigPath());
        }

        // Load from files
        const configs: IConfig[] = await this.getConfigsFromPaths(configPaths);

        // Ensure at least one config exists
        if (configs.length === 0) {
            return Result.error("Failed to load any config files");
        }

        // Combine into single config, with more local config overriding more global config
        const config: IConfig = this.combineConfigs(configs);

        // Validate
        const validationResult: TResult<IConfig, string> =
            this.validate(config);
        if (validationResult.isError()) {
            return Result.error(validationResult.getError()!);
        }

        return Result.success(config);
    }

    private static async getConfigPaths(): Promise<TDirectoryPath[]> {
        const candidateConfigPaths: TDirectoryPath[] = PathService.getParents(
            PathService.getCurrentWorkingDirectory(),
        ).map((path) => PathService.join(path, ".space/config.json"));

        const configPaths: TDirectoryPath[] = [];
        for (const candidatePath of candidateConfigPaths) {
            if (await FileService.exists(candidatePath)) {
                configPaths.push(candidatePath);
            }
        }

        return configPaths;
    }

    private static async createDefaultConfig(): Promise<void> {
        const userConfigPath: TDirectoryPath = this.getUserConfigPath();

        const defaultConfig: IConfig = {
            version: await AppService.getVersion(),
            view: { type: "Workspace File", path: "~/space.code-workspace" },
        };

        await JsonService.save(userConfigPath, defaultConfig);
    }

    private static async getConfigsFromPaths(
        paths: TDirectoryPath[],
    ): Promise<IConfig[]> {
        const configs: IConfig[] = [];
        for (const path of paths) {
            const config: TResult<IConfig, string> =
                await JsonService.load(path);
            if (config.isError()) {
                LoggerService.warn(
                    `Failed to load config from '${path}' - ${config.getError()}`,
                );
                continue;
            }

            configs.push(config.getValue()!);
        }

        return configs;
    }

    private static combineConfigs(configs: IConfig[]): IConfig {
        return this.deepMergeObjects(configs);
    }

    private static deepMergeObjects<TObject>(objects: TObject[]): TObject {
        const isObject = (item: any): item is Record<string, any> => {
            return item && typeof item === "object" && !Array.isArray(item);
        };

        return objects.reduce((prev, current) => {
            if (!current) return prev;

            const next = { ...prev } as Record<string, any>;

            Object.keys(current).forEach((key) => {
                const pVal = next[key];
                const cVal = (current as Record<string, any>)[key];

                if (Array.isArray(pVal) && Array.isArray(cVal)) {
                    next[key] = [...pVal, ...cVal];
                } else if (isObject(pVal) && isObject(cVal)) {
                    next[key] = this.deepMergeObjects([pVal, cVal]);
                } else if (cVal !== undefined) {
                    next[key] = cVal;
                }
            });

            return next;
        }, {} as any) as TObject;
    }

    private static validate(config: IConfig): TResult<IConfig, string> {
        const errors: string[] = [];

        if (!config.version) errors.push("No version specified");
        if (!config.view) errors.push("No view mode specified");

        if (errors.length > 0) {
            return Result.error(
                `Config Validation Errors:\n - ${errors.join("\n - ")}`,
            );
        }

        return Result.success(config);
    }
}

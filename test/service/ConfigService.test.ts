import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppService } from "../../src/service/AppService.js";
import { ConfigService } from "../../src/service/ConfigService.js";
import { FileService } from "../../src/service/fs/FileService.js";
import { PathService } from "../../src/service/fs/PathService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { LoggerService } from "../../src/service/LoggerService.js";
import { Result } from "../../src/types/Result.js";

describe("ConfigService", () => {
    let configService: ConfigService;
    let mockAppService: any;
    let mockFileService: any;
    let mockPathService: any;
    let mockJsonService: any;
    let mockLoggerService: any;

    beforeEach(() => {
        container.clearInstances();

        mockAppService = { getVersion: vi.fn().mockResolvedValue("1.0.0") };
        mockFileService = { exists: vi.fn() };
        mockPathService = {
            toAbsolute: vi.fn((p) => p),
            getCurrentWorkingDirectory: vi.fn(() => "/cwd"),
            getParents: vi.fn(() => []),
            join: vi.fn((...args) => args.join("/")),
        };
        mockJsonService = { load: vi.fn(), save: vi.fn() };
        mockLoggerService = {
            warn: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        };

        container.registerInstance(AppService, mockAppService);
        container.registerInstance(FileService, mockFileService);
        container.registerInstance(PathService, mockPathService);
        container.registerInstance(JsonService, mockJsonService);
        container.registerInstance(LoggerService, mockLoggerService);

        configService = container.resolve(ConfigService);

        vi.clearAllMocks();
    });

    describe("get", () => {
        it("should return config if already loaded", async () => {
            const config = {
                version: "1.0.0",
                active: { path: "p" },
                view: { type: "Workspace" },
            };
            (configService as any).config = config;

            const result = await configService.get();

            expect(result).toBe(config);
        });

        it("should build and return config if not loaded", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockJsonService.load.mockResolvedValue(
                Result.success({
                    version: "1.0.0",
                    active: { path: "active" },
                    view: { type: "Workspace" },
                }),
            );

            const result = await configService.get();

            expect(result.version).toBe("1.0.0");
            expect(mockJsonService.load).toHaveBeenCalled();
        });

        it("should create default config if no config files found", async () => {
            mockPathService.getParents.mockReturnValue([]);
            mockFileService.exists.mockResolvedValue(false);
            mockJsonService.save.mockResolvedValue(Result.success(undefined));
            mockJsonService.load.mockResolvedValue(
                Result.success({
                    version: "1.0.0",
                    active: { path: "active" },
                    view: { type: "Workspace" },
                }),
            );

            await configService.get();

            expect(mockJsonService.save).toHaveBeenCalled();
        });
    });

    describe("deepMergeObjects", () => {
        it("should merge simple objects", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { b: 3, c: 4 };
            const result = (configService as any).deepMergeObjects([
                obj1,
                obj2,
            ]);
            expect(result).toEqual({ a: 1, b: 3, c: 4 });
        });

        it("should merge nested objects", () => {
            const obj1 = { a: { b: 1 } };
            const obj2 = { a: { c: 2 } };
            const result = (configService as any).deepMergeObjects([
                obj1,
                obj2,
            ]);
            expect(result).toEqual({ a: { b: 1, c: 2 } });
        });

        it("should concatenate arrays", () => {
            const obj1 = { a: [1] };
            const obj2 = { a: [2] };
            const result = (configService as any).deepMergeObjects([
                obj1,
                obj2,
            ]);
            expect(result).toEqual({ a: [1, 2] });
        });

        it("should handle null and undefined", () => {
            const obj1 = { a: 1 };
            const obj2 = { a: undefined, b: 2 };
            const obj3 = null;
            const result = (configService as any).deepMergeObjects([
                obj1,
                obj2,
                obj3,
            ]);
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should overwrite with non-object values", () => {
            const obj1 = { a: { b: 1 } };
            const obj2 = { a: 2 };
            const result = (configService as any).deepMergeObjects([
                obj1,
                obj2,
            ]);
            expect(result).toEqual({ a: 2 });
        });
    });

    describe("validate", () => {
        it("should return error if version is missing", () => {
            const config = { view: { type: "Workspace" } } as any;
            const result = (configService as any).validate(config);
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("No version specified");
        });

        it("should return error if view is missing", () => {
            const config = { version: "1.0.0" } as any;
            const result = (configService as any).validate(config);
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("No view mode specified");
        });

        it("should return multiple errors", () => {
            const config = {} as any;
            const result = (configService as any).validate(config);
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("No version specified");
            expect(result.getError()).toContain("No view mode specified");
        });
    });
});

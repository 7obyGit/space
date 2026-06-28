import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { container } from "tsyringe";
import { ConfigService } from "../../src/service/ConfigService.js";
import { AppService } from "../../src/service/AppService.js";
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
        mockLoggerService = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() };

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
            const config = { version: "1.0.0", active: { path: "p" }, view: { type: "Workspace" } };
            (configService as any).config = config;
            
            const result = await configService.get();
            
            expect(result).toBe(config);
        });

        it("should build and return config if not loaded", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockJsonService.load.mockResolvedValue(Result.success({
                version: "1.0.0",
                active: { path: "active" },
                view: { type: "Workspace" }
            }));

            const result = await configService.get();
            
            expect(result.version).toBe("1.0.0");
            expect(mockJsonService.load).toHaveBeenCalled();
        });

        it("should create default config if no config files found", async () => {
            mockPathService.getParents.mockReturnValue([]);
            mockFileService.exists.mockResolvedValue(false);
            mockJsonService.save.mockResolvedValue(Result.success(undefined));
            mockJsonService.load.mockResolvedValue(Result.success({
                version: "1.0.0",
                active: { path: "active" },
                view: { type: "Workspace" }
            }));

            await configService.get();
            
            expect(mockJsonService.save).toHaveBeenCalled();
        });
    });
});

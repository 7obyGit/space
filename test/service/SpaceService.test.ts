import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { container } from "tsyringe";
import { SpaceService } from "../../src/service/SpaceService.js";
import { ConfigService } from "../../src/service/ConfigService.js";
import { FileService } from "../../src/service/fs/FileService.js";
import { PathService } from "../../src/service/fs/PathService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { LoggerService } from "../../src/service/LoggerService.js";
import { Result } from "../../src/types/Result.js";

describe("SpaceService", () => {
    let spaceService: SpaceService;
    let mockConfigService: any;
    let mockFileService: any;
    let mockPathService: any;
    let mockJsonService: any;
    let mockLoggerService: any;

    beforeEach(() => {
        container.clearInstances();

        mockConfigService = { get: vi.fn() };
        mockFileService = { exists: vi.fn(), createDirectory: vi.fn(), listFiles: vi.fn(), delete: vi.fn() };
        mockPathService = {
            join: vi.fn((...args) => args.join("/")),
            getParents: vi.fn(() => []),
            getCurrentWorkingDirectory: vi.fn(() => "/cwd"),
            getName: vi.fn((p) => p),
            getExtension: vi.fn(() => ".json"),
        };
        mockJsonService = { load: vi.fn(), save: vi.fn() };
        mockLoggerService = { warn: vi.fn(), info: vi.fn() };

        container.registerInstance(ConfigService, mockConfigService);
        container.registerInstance(FileService, mockFileService);
        container.registerInstance(PathService, mockPathService);
        container.registerInstance(JsonService, mockJsonService);
        container.registerInstance(LoggerService, mockLoggerService);

        spaceService = container.resolve(SpaceService);
        
        vi.clearAllMocks();
    });

    describe("getActivePath", () => {
        it("should return active path from config", async () => {
            mockConfigService.get.mockResolvedValue({ active: { path: "active-path" } });
            const path = await spaceService.getActivePath();
            expect(path).toBe("active-path");
        });
    });

    describe("list", () => {
        it("should return list of loaded spaces", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(Result.success(["space1.json"]));
            mockJsonService.load.mockResolvedValue(Result.success({ folders: [] }));
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const spaces = await spaceService.list();
            
            expect(spaces.length).toBe(2); // One for spaces, one for .space/spaces (mocked join makes them distinct)
            expect(mockJsonService.load).toHaveBeenCalled();
        });
    });

    describe("create", () => {
        it("should create a new space", async () => {
            mockConfigService.get.mockResolvedValue({ active: { path: "active" } });
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValueOnce(false); // get(name) -> undefined
            mockFileService.exists.mockResolvedValueOnce(true);  // exists(spacesPath) -> true
            mockFileService.exists.mockResolvedValueOnce(true);  // get(name) again -> loaded
            
            mockFileService.listFiles.mockResolvedValue(Result.success(["new.code-workspace"]));
            mockJsonService.load.mockResolvedValue(Result.success({ space: { name: "new" } }));
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const space = await spaceService.create("new");
            
            expect(space.space.name).toBe("new");
            expect(mockJsonService.save).toHaveBeenCalled();
        });
    });
});

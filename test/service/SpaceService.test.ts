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

        it("should return existing space if it already exists", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(Result.success(["existing.code-workspace"]));
            mockJsonService.load.mockResolvedValue(Result.success({ space: { name: "existing" } }));

            const space = await spaceService.create("existing");
            
            expect(space.space.name).toBe("existing");
            expect(mockLoggerService.warn).toHaveBeenCalledWith(expect.stringContaining("already exists"));
        });
    });

    describe("use", () => {
        it("should switch to a new space", async () => {
            const activePath = "/active/path";
            const newPath = "/path/new";
            const newSpace = { space: { name: "new", path: newPath } };
            const oldSpace = { space: { name: "old", path: "/path/old" } };
            
            vi.spyOn(spaceService, "get").mockResolvedValue(newSpace as any);
            vi.spyOn(spaceService, "getActive").mockResolvedValue(oldSpace as any);
            mockConfigService.get.mockResolvedValue({ active: { path: activePath } });
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.use("new");
            
            expect(result.isSuccess()).toBe(true);
            expect(mockJsonService.save).toHaveBeenCalledWith(activePath, expect.anything());
        });

        it("should return error if new space does not exist", async () => {
            vi.spyOn(spaceService, "get").mockResolvedValue(undefined);
            const result = await spaceService.use("missing");
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("No space with name 'missing' exists");
        });

        it("should return error if active space has no name", async () => {
            const newSpace = { space: { name: "new", path: "/path/new" } };
            const oldSpace = { space: { path: "/path/old" } }; // Missing name
            
            vi.spyOn(spaceService, "get").mockResolvedValue(newSpace as any);
            vi.spyOn(spaceService, "getActive").mockResolvedValue(oldSpace as any);
            
            const result = await spaceService.use("new");
            
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("No name present");
        });
    });

    describe("delete", () => {
        it("should return success false if space doesn't exist", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            const result = await spaceService.delete("missing");
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(false);
        });

        it("should return success false if space is active", async () => {
            const activePath = "/cwd/spaces/active.code-workspace";
            mockConfigService.get.mockResolvedValue({ active: { path: activePath } });
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(Result.success([activePath]));
            mockJsonService.load.mockResolvedValue(Result.success({ space: { name: "active" } }));

            const result = await spaceService.delete("active");
            
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(false);
            expect(mockLoggerService.warn).toHaveBeenCalledWith(expect.stringContaining("currently active"));
        });
    });
});

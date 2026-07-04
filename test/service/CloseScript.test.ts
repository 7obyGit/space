import "reflect-metadata";
import { aw } from "@7obygit/aw";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "../../src/service/ConfigService.js";
import { FileService } from "../../src/service/fs/FileService.js";
import { LinkService } from "../../src/service/fs/LinkService.js";
import { PathService } from "../../src/service/fs/PathService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { LoggerService } from "../../src/service/LoggerService.js";
import { SpaceService } from "../../src/service/SpaceService.js";
import { TerminalService } from "../../src/service/TerminalService.js";
import { Result } from "../../src/types/Result.js";

vi.mock("@7obygit/aw", () => ({
    aw: {
        exec: vi.fn(),
    },
}));

describe("SpaceService Close Script", () => {
    let spaceService: SpaceService;
    let mockConfigService: any;
    let mockFileService: any;
    let mockPathService: any;
    let mockJsonService: any;
    let mockLoggerService: any;
    let mockTerminalService: any;

    beforeEach(() => {
        container.clearInstances();

        mockConfigService = { get: vi.fn() };
        mockFileService = {
            exists: vi.fn(),
            createDirectory: vi.fn(),
            listFiles: vi.fn(),
            delete: vi.fn(),
            isFile: vi.fn(),
        };
        mockPathService = {
            join: vi.fn((...args) => args.join("/")),
            getParents: vi.fn(() => []),
            getCurrentWorkingDirectory: vi.fn(() => "/cwd"),
            getName: vi.fn((p) => p),
            getExtension: vi.fn(() => ".json"),
            toAbsolute: vi.fn((p) => p),
        };
        mockJsonService = { load: vi.fn(), save: vi.fn() };
        mockLoggerService = { warn: vi.fn(), info: vi.fn(), error: vi.fn() };
        mockTerminalService = { run: vi.fn() };

        container.registerInstance(ConfigService, mockConfigService);
        container.registerInstance(FileService, mockFileService);
        container.registerInstance(PathService, mockPathService);
        container.registerInstance(JsonService, mockJsonService);
        container.registerInstance(LoggerService, mockLoggerService);
        container.registerInstance(LinkService, {} as any);
        container.registerInstance(TerminalService, mockTerminalService);

        spaceService = container.resolve(SpaceService);

        vi.clearAllMocks();
    });

    it("should run the close script when switching spaces", async () => {
        const activePath = "/active/path";
        const newPath = "/path/new";
        
        const activeSpace = {
            space: {
                name: "old",
                path: "/path/old",
                scripts: {
                    close: "echo 'closing old space'",
                },
            },
        };

        const newSpace = {
            space: {
                name: "new",
                path: newPath,
            },
        };

        // Mock getActive to return activeSpace
        vi.spyOn(spaceService, "getActive").mockResolvedValue(activeSpace as any);
        // Mock get(name) to return newSpace
        vi.spyOn(spaceService, "get").mockResolvedValue(newSpace as any);
        // Mock getActivePath
        vi.spyOn(spaceService, "getActivePath").mockResolvedValue(activePath);
        
        mockConfigService.get.mockResolvedValue({
            active: { path: activePath },
        });
        mockJsonService.save.mockResolvedValue(Result.success(undefined));

        const result = await spaceService.use("new");

        expect(result.isSuccess()).toBe(true);
        // Verify close script was called
        expect(aw.exec).toHaveBeenCalledWith("echo 'closing old space'", expect.anything());
    });

    it("should NOT fail if no close script is defined", async () => {
        const activePath = "/active/path";
        const newPath = "/path/new";
        
        const activeSpace = {
            space: {
                name: "old",
                path: "/path/old",
                scripts: {}, // No close script
            },
        };

        const newSpace = {
            space: {
                name: "new",
                path: newPath,
            },
        };

        vi.spyOn(spaceService, "getActive").mockResolvedValue(activeSpace as any);
        vi.spyOn(spaceService, "get").mockResolvedValue(newSpace as any);
        vi.spyOn(spaceService, "getActivePath").mockResolvedValue(activePath);
        
        mockConfigService.get.mockResolvedValue({
            active: { path: activePath },
        });
        mockJsonService.save.mockResolvedValue(Result.success(undefined));

        const result = await spaceService.use("new");

        expect(result.isSuccess()).toBe(true);
        expect(aw.exec).not.toHaveBeenCalled();
        expect(mockLoggerService.warn).not.toHaveBeenCalled();
    });
});

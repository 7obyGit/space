import "reflect-metadata";
import { aw } from "@7obygit/aw";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenCommand } from "../../src/command/OpenCommand.js";
import { SpaceService } from "../../src/service/SpaceService.js";
import { LoggerService } from "../../src/service/LoggerService.js";
import { TerminalService } from "../../src/service/TerminalService.js";
import { PathService } from "../../src/service/fs/PathService.js";
import { ConfigService } from "../../src/service/ConfigService.js";
import { FileService } from "../../src/service/fs/FileService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { LinkService } from "../../src/service/fs/LinkService.js";

vi.mock("@7obygit/aw", () => ({
    aw: {
        exec: vi.fn(),
    },
}));

describe("OpenCommand Hooks Integration", () => {
    let openCommand: OpenCommand;
    let spaceService: SpaceService;
    let mockLoggerService: any;
    let mockTerminalService: any;
    let mockPathService: any;
    let mockConfigService: any;
    let mockJsonService: any;
    let mockFileService: any;

    beforeEach(() => {
        container.clearInstances();

        mockLoggerService = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
        mockTerminalService = { run: vi.fn() };
        mockPathService = { 
            toAbsolute: vi.fn((p) => p),
            join: vi.fn((...args) => args.join("/")),
            getCurrentWorkingDirectory: vi.fn(() => "/cwd"),
            getParents: vi.fn(() => []),
        };
        mockConfigService = { get: vi.fn() };
        mockJsonService = { load: vi.fn() };
        mockFileService = { exists: vi.fn().mockResolvedValue(true) };

        container.registerInstance(LoggerService, mockLoggerService);
        container.registerInstance(TerminalService, mockTerminalService);
        container.registerInstance(PathService, mockPathService);
        container.registerInstance(ConfigService, mockConfigService);
        container.registerInstance(JsonService, mockJsonService);
        container.registerInstance(FileService, mockFileService);
        container.registerInstance(LinkService, {} as any);

        spaceService = container.resolve(SpaceService);
        // We need to register the real spaceService so the decorator uses it
        container.registerInstance(SpaceService, spaceService);

        openCommand = container.resolve(OpenCommand);
        vi.clearAllMocks();
    });

    it("should run string-based open script (fixed)", async () => {
        const activeSpace = {
            space: {
                name: "test",
                scripts: {
                    open: "echo 'string script'",
                },
            },
        };

        vi.spyOn(spaceService, "getActive").mockResolvedValue(activeSpace as any);
        vi.spyOn(spaceService, "getActivePath").mockResolvedValue("/some/path.code-workspace");

        await openCommand.execute();

        expect(aw.exec).toHaveBeenCalledWith("echo 'string script'", expect.anything());
    });

    it("should run hook if it is an object with pre-command and command", async () => {
        const activeSpace = {
            space: {
                name: "test",
                scripts: {
                    open: {
                        "pre-command": "echo 'pre'",
                        "command": "echo 'cmd'",
                    },
                },
            },
        };

        vi.spyOn(spaceService, "getActive").mockResolvedValue(activeSpace as any);
        vi.spyOn(spaceService, "getActivePath").mockResolvedValue("/some/path.code-workspace");

        await openCommand.execute();

        expect(aw.exec).toHaveBeenCalledWith("echo 'pre'", expect.anything());
        expect(aw.exec).toHaveBeenCalledWith("echo 'cmd'", expect.anything());
    });
});

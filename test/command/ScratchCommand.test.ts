import "reflect-metadata";
import { Cli } from "clipanion";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { container } from "tsyringe";
import { ScratchCommand } from "../../src/command/ScratchCommand.js";
import { SpaceService } from "../../src/service/SpaceService.js";
import { LoggerService } from "../../src/service/LoggerService.js";
import { TerminalService } from "../../src/service/TerminalService.js";
import { PathService } from "../../src/service/fs/PathService.js";

vi.mock("tsyringe", async () => {
    const actual = await vi.importActual("tsyringe");
    return {
        ...actual,
        singleton: () => (target: any) => target,
    };
});

describe("ScratchCommand", () => {
    let spaceService: any;
    let loggerService: any;
    let terminalService: any;
    let pathService: any;

    beforeEach(() => {
        spaceService = {
            scratch: vi.fn().mockResolvedValue({
                workspacePath: "/tmp/space/scratch.code-workspace",
                readmePath: "/tmp/space/work/README.md",
            }),
            runHook: vi.fn().mockResolvedValue(undefined),
        };
        loggerService = {
            info: vi.fn(),
            error: vi.fn(),
        };
        terminalService = {
            run: vi.fn().mockResolvedValue(undefined),
        };
        pathService = {
            toAbsolute: vi.fn((p) => `/abs${p}`),
        };

        container.clearInstances();
        container.registerInstance(SpaceService, spaceService);
        container.registerInstance(LoggerService, loggerService);
        container.registerInstance(TerminalService, terminalService);
        container.registerInstance(PathService, pathService);
    });

    it("should call spaceService.scratch and open with code", async () => {
        const cli = new Cli();
        cli.register(ScratchCommand);

        await cli.run(["scratch"]);

        expect(spaceService.scratch).toHaveBeenCalled();
        expect(terminalService.run).toHaveBeenCalledWith(
            expect.stringContaining(
                'code "/abs/tmp/space/scratch.code-workspace" "/abs/tmp/space/work/README.md"',
            ),
        );
        expect(loggerService.info).toHaveBeenCalledWith(
            expect.stringContaining("Successfully created scratch space"),
        );
    });
});

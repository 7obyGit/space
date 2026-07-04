import "reflect-metadata";
import { Cli } from "clipanion";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { container } from "tsyringe";
import { CloneCommand } from "../../src/command/CloneCommand.js";
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

describe("CloneCommand", () => {
    let spaceService: any;
    let loggerService: any;
    let terminalService: any;
    let pathService: any;

    beforeEach(() => {
        spaceService = {
            clone: vi
                .fn()
                .mockResolvedValue("/tmp/space/scratch.code-workspace"),
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
            toAbsolute: vi
                .fn()
                .mockReturnValue("/abs/tmp/space/scratch.code-workspace"),
        };

        container.clearInstances();
        container.registerInstance(SpaceService, spaceService);
        container.registerInstance(LoggerService, loggerService);
        container.registerInstance(TerminalService, terminalService);
        container.registerInstance(PathService, pathService);
    });

    it("should call spaceService.clone without url when no argument provided", async () => {
        const cli = new Cli();
        cli.register(CloneCommand);

        await cli.run(["clone"]);

        expect(spaceService.clone).toHaveBeenCalledWith(undefined);
        expect(terminalService.run).toHaveBeenCalledWith(
            expect.stringContaining(
                'code "/abs/tmp/space/scratch.code-workspace"',
            ),
        );
    });

    it("should call spaceService.clone with url when argument provided", async () => {
        const cli = new Cli();
        cli.register(CloneCommand);

        const testUrl = "https://github.com/test/repo.git";
        await cli.run(["clone", testUrl]);

        expect(spaceService.clone).toHaveBeenCalledWith(testUrl);
    });
});

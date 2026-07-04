import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InitCommand } from "../../src/command/InitCommand.js";
import { SpaceService } from "../../src/service/SpaceService.js";
import { LoggerService } from "../../src/service/LoggerService.js";

describe("InitCommand", () => {
    let initCommand: InitCommand;
    let mockSpaceService: any;
    let mockLoggerService: any;

    beforeEach(() => {
        container.clearInstances();

        mockSpaceService = {
            init: vi.fn(),
            runHook: vi.fn(),
        };
        mockLoggerService = {
            info: vi.fn(),
            error: vi.fn(),
        };

        container.registerInstance(SpaceService, mockSpaceService);
        container.registerInstance(LoggerService, mockLoggerService);

        initCommand = container.resolve(InitCommand);
    });

    it("should call spaceService.init and log success", async () => {
        const mockSpace = {
            space: {
                name: "test-space",
            },
        };
        mockSpaceService.init.mockResolvedValue(mockSpace);

        await initCommand.execute();

        expect(mockSpaceService.init).toHaveBeenCalled();
        expect(mockLoggerService.info).toHaveBeenCalledWith(
            expect.stringContaining("test-space"),
        );
        expect(mockLoggerService.info).toHaveBeenCalledWith(
            expect.stringContaining("space use test-space"),
        );
    });

    it("should log error if spaceService.init fails", async () => {
        mockSpaceService.init.mockRejectedValue(new Error("Failed"));

        const result = await initCommand.execute();

        expect(result).toBe(1);
        expect(mockLoggerService.error).toHaveBeenCalledWith(
            expect.stringContaining("Failed to initialize space: Failed"),
        );
    });
});

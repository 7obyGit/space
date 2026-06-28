import "reflect-metadata";
import { container } from "tsyringe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerService } from "../../src/service/LoggerService.js";

describe("LoggerService", () => {
    let loggerService: LoggerService;
    const mockDate = new Date("2026-06-28T15:00:00.000Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        container.clearInstances();
        loggerService = container.resolve(LoggerService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should log info messages", () => {
        const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        const message = "test info message";

        loggerService.info(message);

        const expected = `[${mockDate.toISOString()}] info:  ${JSON.stringify(message, null, 2)}`;
        expect(consoleSpy).toHaveBeenCalledWith(expected);
        consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const message = "test error message";

        loggerService.error(message);

        const expected = `[${mockDate.toISOString()}] error:  ${JSON.stringify(message, null, 2)}`;
        expect(consoleSpy).toHaveBeenCalledWith(expected);
        consoleSpy.mockRestore();
    });

    it("should log warn messages", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const message = "test warn message";

        loggerService.warn(message);

        const expected = `[${mockDate.toISOString()}] warn:  ${JSON.stringify(message, null, 2)}`;
        expect(consoleSpy).toHaveBeenCalledWith(expected);
        consoleSpy.mockRestore();
    });

    it("should log debug messages", () => {
        const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
        const message = "test debug message";

        loggerService.debug(message);

        const expected = `[${mockDate.toISOString()}] debug:  ${JSON.stringify(message, null, 2)}`;
        expect(consoleSpy).toHaveBeenCalledWith(expected);
        consoleSpy.mockRestore();
    });
});

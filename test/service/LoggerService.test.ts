import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { container } from "tsyringe";
import { LoggerService } from "../../src/service/LoggerService.js";

describe("LoggerService", () => {
    let loggerService: LoggerService;

    beforeEach(() => {
        container.clearInstances();
        loggerService = container.resolve(LoggerService);
    });

    it("should log info messages", () => {
        const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        const message = "test info message";
        
        loggerService.info(message);
        
        expect(consoleSpy).toHaveBeenCalledWith(`info:  ${message}`);
        consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const message = "test error message";
        
        loggerService.error(message);
        
        expect(consoleSpy).toHaveBeenCalledWith(`error:  ${message}`);
        consoleSpy.mockRestore();
    });

    it("should log warn messages", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const message = "test warn message";
        
        loggerService.warn(message);
        
        expect(consoleSpy).toHaveBeenCalledWith(`warn:  ${message}`);
        consoleSpy.mockRestore();
    });

    it("should log debug messages", () => {
        const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
        const message = "test debug message";
        
        loggerService.debug(message);
        
        expect(consoleSpy).toHaveBeenCalledWith(`debug:  ${message}`);
        consoleSpy.mockRestore();
    });
});

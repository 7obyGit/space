import chalk from "chalk";
import "reflect-metadata";
import { container } from "tsyringe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerService } from "../../src/service/LoggerService.js";

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, "");

describe("LoggerService", () => {
    let loggerService: LoggerService;
    const mockDate = new Date("2026-06-28T15:00:00.000Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        process.env.FORCE_COLOR = "1";
        chalk.level = 1;
        container.clearInstances();
        loggerService = container.resolve(LoggerService);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("should log info messages", () => {
        const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        const message = "test info message";
        loggerService.info(message);
        expect(stripAnsi(consoleSpy.mock.calls[0][0])).toBe(message);
    });

    it("should render markdown messages", () => {
        const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        const message = "# Header";
        loggerService.info(message);
        const calledWith = consoleSpy.mock.calls[0][0];
        expect(stripAnsi(calledWith)).toContain("Header");
        expect(calledWith).toMatch(/\u001b/);
    });

    it("should preserve existing chalk colors", () => {
        const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        const message = chalk.blue("blue message");
        loggerService.info(message);
        expect(consoleSpy.mock.calls[0][0]).toBe(message);
    });

    it("should log error messages", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const message = "test error message";
        loggerService.error(message);
        expect(stripAnsi(consoleSpy.mock.calls[0][0])).toBe(message);
    });

    it("should log warn messages", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const message = "test warn message";
        loggerService.warn(message);
        expect(stripAnsi(consoleSpy.mock.calls[0][0])).toBe(message);
    });

    it("should log debug messages", () => {
        const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
        const message = "test debug message";
        loggerService.debug(message);
        expect(stripAnsi(consoleSpy.mock.calls[0][0])).toBe(message);
    });

    it("should log objects with timestamps in markdown blocks", () => {
        const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        const obj = { foo: "bar" };
        loggerService.info(obj);
        const calledWith = consoleSpy.mock.calls[0][0];
        const stripped = stripAnsi(calledWith);
        expect(stripped).toContain(`[${mockDate.toISOString()}] INFO:`);
        expect(stripped).toContain(`"foo": "bar"`);
        expect(stripped).toMatch(/  "foo": "bar"/);
        expect(calledWith).toMatch(/\u001b/);
    });
});

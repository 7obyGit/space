import * as child_process from "node:child_process";
import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerminalService } from "../../src/service/TerminalService.js";

vi.mock("node:child_process", () => ({
    exec: vi.fn(),
}));

describe("TerminalService", () => {
    let terminalService: TerminalService;

    beforeEach(() => {
        container.clearInstances();
        terminalService = container.resolve(TerminalService);
        vi.clearAllMocks();
    });

    it("should run a command and return stdout and stderr", async () => {
        const mockStdout = "hello world\n";
        const mockStderr = "";
        (child_process.exec as any).mockImplementation(
            (command: string, callback: any) => {
                callback(null, mockStdout, mockStderr);
            },
        );

        const result = await terminalService.run("echo 'hello world'");

        expect(result.isSuccess()).toBe(true);
        const value = result.getValue();
        expect(value.stdout).toBe(mockStdout);
        expect(value.stderr).toBe(mockStderr);
        expect(value.exitCode).toBe(0);
        expect(child_process.exec).toHaveBeenCalledWith(
            "echo 'hello world'",
            expect.any(Function),
        );
    });

    it("should return exit code if command fails", async () => {
        const mockStdout = "";
        const mockStderr = "command not found\n";
        const mockError = { code: 127 };
        (child_process.exec as any).mockImplementation(
            (command: string, callback: any) => {
                callback(mockError, mockStdout, mockStderr);
            },
        );

        const result = await terminalService.run("nonexistent-command");

        expect(result.isSuccess()).toBe(true);
        const value = result.getValue();
        expect(value.stdout).toBe(mockStdout);
        expect(value.stderr).toBe(mockStderr);
        expect(value.exitCode).toBe(127);
    });

    it("should return error if exec fails to start", async () => {
        const mockError = new Error("Spawn failed");
        (child_process.exec as any).mockImplementation(
            (command: string, callback: any) => {
                callback(mockError, "", "");
            },
        );

        const result = await terminalService.run("any-command");

        expect(result.isError()).toBe(true);
        expect(result.getError()).toContain(
            "Failed to execute command: Spawn failed",
        );
    });
});

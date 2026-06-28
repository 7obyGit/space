import * as fs from "node:fs/promises";
import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileService } from "../../../src/service/fs/FileService.js";
import { PathService } from "../../../src/service/fs/PathService.js";

// Mock node:fs/promises
vi.mock("node:fs/promises", () => ({
    stat: vi.fn(),
    lstat: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    rm: vi.fn(),
    writeFile: vi.fn(),
    cp: vi.fn(),
}));

describe("FileService", () => {
    let fileService: FileService;
    let mockPathService: any;

    beforeEach(() => {
        container.clearInstances();

        mockPathService = {
            toAbsolute: vi.fn((p) => p),
            getParent: vi.fn((p) => "parent"),
            join: vi.fn((...args) => args.join("/")),
        };

        container.registerInstance(PathService, mockPathService);
        fileService = container.resolve(FileService);

        vi.clearAllMocks();
    });

    describe("exists", () => {
        it("should return true if stat succeeds", async () => {
            (fs.stat as any).mockResolvedValue({});
            const result = await fileService.exists("test.txt");
            expect(result).toBe(true);
        });

        it("should return false if stat fails", async () => {
            (fs.stat as any).mockRejectedValue(new Error("File not found"));
            const result = await fileService.exists("test.txt");
            expect(result).toBe(false);
        });
    });

    describe("read", () => {
        it("should return file content on success", async () => {
            const content = "hello world";
            (fs.stat as any).mockResolvedValue({}); // parent exists
            (fs.readFile as any).mockResolvedValue(content);

            const result = await fileService.read("test.txt");

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(content);
        });

        it("should create directory if parent doesn't exist", async () => {
            (fs.stat as any)
                .mockRejectedValueOnce(new Error("Parent doesn't exist")) // exists(parent) -> false
                .mockResolvedValueOnce({}); // dummy for readFile
            (fs.mkdir as any).mockResolvedValue(undefined);
            (fs.readFile as any).mockResolvedValue("content");

            await fileService.read("test.txt");

            expect(fs.mkdir).toHaveBeenCalledWith("parent", {
                recursive: true,
            });
        });

        it("should return error on failure", async () => {
            (fs.stat as any).mockResolvedValue({});
            (fs.readFile as any).mockRejectedValue(new Error("Read error"));

            const result = await fileService.read("test.txt");

            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Read error");
        });
    });

    describe("write", () => {
        it("should write file content on success", async () => {
            (fs.stat as any).mockResolvedValue({});
            (fs.writeFile as any).mockResolvedValue(undefined);

            const result = await fileService.write("test.txt", "content");

            expect(result.isSuccess()).toBe(true);
            expect(fs.writeFile).toHaveBeenCalledWith(
                "test.txt",
                "content",
                "utf8",
            );
        });

        it("should return error on write failure", async () => {
            (fs.stat as any).mockResolvedValue({});
            (fs.writeFile as any).mockRejectedValue(new Error("Write failed"));

            const result = await fileService.write("test.txt", "content");

            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Write failed");
        });
    });

    describe("copy", () => {
        it("should copy file on success", async () => {
            (fs.stat as any).mockResolvedValue({}); // source and destination parent exist
            (fs.cp as any).mockResolvedValue(undefined);

            const result = await fileService.copy("src", "dest");

            expect(result.isSuccess()).toBe(true);
            expect(fs.cp).toHaveBeenCalledWith("src", "dest", {
                recursive: true,
            });
        });

        it("should return error if source does not exist", async () => {
            (fs.stat as any).mockRejectedValue(new Error("Not found"));

            const result = await fileService.copy("src", "dest");

            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Source 'src' does not exist");
        });
    });

    describe("delete", () => {
        it("should delete path on success", async () => {
            (fs.rm as any).mockResolvedValue(undefined);
            const result = await fileService.delete("path");
            expect(result.isSuccess()).toBe(true);
        });

        it("should return error on delete failure", async () => {
            (fs.rm as any).mockRejectedValue(new Error("Delete failed"));
            const result = await fileService.delete("path");
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Delete failed");
        });
    });

    describe("listFiles", () => {
        it("should return list of files", async () => {
            (fs.stat as any).mockResolvedValue({}); // directory exists
            (fs.readdir as any).mockResolvedValue([
                { isFile: () => true, name: "file1.txt" },
                { isFile: () => false, name: "dir1" },
            ]);

            const result = await fileService.listFiles("dir");

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toEqual(["dir/file1.txt"]);
        });
    });
});

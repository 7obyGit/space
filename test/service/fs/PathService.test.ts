import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { container } from "tsyringe";
import { PathService } from "../../../src/service/fs/PathService.js";
import { homedir } from "node:os";
import { resolve, join } from "node:path";

describe("PathService", () => {
    let pathService: PathService;

    beforeEach(() => {
        container.clearInstances();
        pathService = container.resolve(PathService);
    });

    describe("expandHome", () => {
        it("should expand ~ to home directory", () => {
            const path = "~/test";
            const expected = join(homedir(), "test");
            expect(pathService.toAbsolute(path)).toBe(expected);
        });

        it("should not expand ~ if it's not at the start", () => {
            const path = "/path/to/~/test";
            expect(pathService.toAbsolute(path)).toBe(resolve(path));
        });
    });

    describe("isAbsolute", () => {
        it("should return true for absolute paths", () => {
            expect(pathService.isAbsolute("/tmp/test")).toBe(true);
        });

        it("should return true for absolute paths with ~", () => {
            expect(pathService.isAbsolute("~/test")).toBe(true);
        });

        it("should return false for relative paths", () => {
            expect(pathService.isAbsolute("test")).toBe(false);
            expect(pathService.isAbsolute("./test")).toBe(false);
        });
    });

    describe("toAbsolute", () => {
        it("should convert relative path to absolute using CWD", () => {
            const path = "test.txt";
            const expected = resolve(process.cwd(), path);
            expect(pathService.toAbsolute(path)).toBe(expected);
        });

        it("should convert relative path to absolute using base", () => {
            const path = "test.txt";
            const base = "/tmp";
            const expected = resolve(base, path);
            expect(pathService.toAbsolute(path, base)).toBe(expected);
        });
    });

    describe("toRelative", () => {
        it("should convert absolute path to relative", () => {
            const from = "/tmp";
            const to = "/tmp/test/file.txt";
            expect(pathService.toRelative(from, to)).toBe("test/file.txt");
        });
    });

    describe("getParent", () => {
        it("should return parent directory", () => {
            expect(pathService.getParent("/tmp/test/file.txt")).toBe(resolve("/tmp/test"));
        });
    });

    describe("getParents", () => {
        it("should return all parent directories", () => {
            const path = "/a/b/c";
            const parents = pathService.getParents(path);
            // On linux, it should be ['/', '/a', '/a/b']
            expect(parents).toContain(resolve("/"));
            expect(parents).toContain(resolve("/a"));
            expect(parents).toContain(resolve("/a/b"));
        });

        it("should include CWD if requested", () => {
            const path = "/tmp";
            const parents = pathService.getParents(path, { includeCurrentWorkingDirectory: true });
            expect(parents).toContain(process.cwd());
        });
    });

    describe("getName", () => {
        it("should return file name", () => {
            expect(pathService.getName("/tmp/test.txt")).toBe("test.txt");
        });

        it("should return file name without extension if provided", () => {
            expect(pathService.getName("/tmp/test.txt", ".txt")).toBe("test");
        });
    });

    describe("getExtension", () => {
        it("should return file extension", () => {
            expect(pathService.getExtension("/tmp/test.txt")).toBe(".txt");
        });
    });

    describe("join", () => {
        it("should join path segments", () => {
            expect(pathService.join("a", "b", "c")).toBe(join("a", "b", "c"));
        });

        it("should expand home if it's the first segment", () => {
            expect(pathService.join("~", "test")).toBe(join(homedir(), "test"));
        });
    });
});

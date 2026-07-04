import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileService } from "../../src/service/fs/FileService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { Result } from "../../src/types/Result.js";

describe("JsonService", () => {
    let jsonService: JsonService;
    let mockFileService: any;

    beforeEach(() => {
        container.clearInstances();

        // Create a mock for FileService
        mockFileService = {
            read: vi.fn(),
            write: vi.fn(),
        };

        // Register the mock in the container
        container.registerInstance(FileService, mockFileService);

        jsonService = container.resolve(JsonService);
    });

    describe("parse", () => {
        it("should parse valid JSON5", () => {
            const json = "{ name: 'test', count: 1 }";
            const result = jsonService.parse<{ name: string; count: number }>(
                json,
            );

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toEqual({ name: "test", count: 1 });
        });

        it("should return error for invalid JSON", () => {
            const json = "{ name: 'test', ";
            const result = jsonService.parse(json);

            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Failed to parse");
        });

        it("should use validator if provided", () => {
            const json = "{ name: 'test' }";
            const validator = vi
                .fn()
                .mockReturnValue({ valid: false, errors: ["Invalid"] });

            const result = jsonService.parse(json, validator);

            expect(validator).toHaveBeenCalled();
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Invalid");
        });
    });

    describe("load", () => {
        it("should load and parse file content", async () => {
            const path = "test.json";
            const content = "{ key: 'value' }";
            mockFileService.read.mockResolvedValue(Result.success(content));

            const result = await jsonService.load<{ key: string }>(path);

            expect(mockFileService.read).toHaveBeenCalledWith(path);
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toEqual({ key: "value" });
        });

        it("should return error if file read fails", async () => {
            const path = "missing.json";
            mockFileService.read.mockResolvedValue(
                Result.error("File not found"),
            );

            const result = await jsonService.load(path);

            expect(result.isError()).toBe(true);
            expect(result.getError()).toBe("File not found");
        });
    });

    describe("stringify", () => {
        it("should stringify object to pretty JSON", () => {
            const obj = { a: 1 };
            const result = jsonService.stringify(obj);

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(JSON.stringify(obj, null, 4));
        });

        it("should return error for circular reference", () => {
            const obj: any = { a: 1 };
            obj.self = obj;

            const result = jsonService.stringify(obj);

            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Failed to stringify");
        });
    });

    describe("save", () => {
        it("should stringify and write to file", async () => {
            const path = "save.json";
            const obj = { saved: true };
            mockFileService.write.mockResolvedValue(Result.success(undefined));

            const result = await jsonService.save(path, obj);

            expect(mockFileService.write).toHaveBeenCalledWith(
                path,
                JSON.stringify(obj, null, 4),
            );
            expect(result.isSuccess()).toBe(true);
        });
    });
});

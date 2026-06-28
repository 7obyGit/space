import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { container } from "tsyringe";
import { LinkService } from "../../../src/service/fs/LinkService.js";
import * as fs from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
    symlink: vi.fn(),
    readlink: vi.fn(),
    realpath: vi.fn(),
}));

describe("LinkService", () => {
    let linkService: LinkService;

    beforeEach(() => {
        container.clearInstances();
        linkService = container.resolve(LinkService);
        vi.clearAllMocks();
    });

    describe("create", () => {
        it("should create symlink", async () => {
            (fs.symlink as any).mockResolvedValue(undefined);
            const result = await linkService.create({ from: "from", to: "to" });
            expect(result.isSuccess()).toBe(true);
            expect(fs.symlink).toHaveBeenCalledWith("to", "from");
        });

        it("should return error on failure", async () => {
            (fs.symlink as any).mockRejectedValue(new Error("Symlink error"));
            const result = await linkService.create({ from: "from", to: "to" });
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("Symlink error");
        });
    });

    describe("getLinkTarget", () => {
        it("should return link target", async () => {
            (fs.readlink as any).mockResolvedValue("target");
            const result = await linkService.getLinkTarget("link");
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe("target");
        });
    });

    describe("getRealPath", () => {
        it("should return real path", async () => {
            (fs.realpath as any).mockResolvedValue("real");
            const result = await linkService.getRealPath("link");
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe("real");
        });
    });
});

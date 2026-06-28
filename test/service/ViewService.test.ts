import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "../../src/service/ConfigService.js";
import { ViewService } from "../../src/service/ViewService.js";

describe("ViewService", () => {
    let viewService: ViewService;
    let mockConfigService: any;

    beforeEach(() => {
        container.clearInstances();

        mockConfigService = {
            get: vi.fn(),
        };

        container.registerInstance(ConfigService, mockConfigService);
        viewService = container.resolve(ViewService);

        vi.clearAllMocks();
    });

    describe("refresh", () => {
        it("should return success for Workspace view", async () => {
            mockConfigService.get.mockResolvedValue({
                view: { type: "Workspace" },
            });

            const result = await viewService.refresh();

            expect(result.isSuccess()).toBe(true);
        });

        it("should throw error for unknown view type", async () => {
            mockConfigService.get.mockResolvedValue({
                view: { type: "Unknown" },
            });

            await expect(viewService.refresh()).rejects.toThrow("Unknown view type");
        });

        it("should throw error for Folder view (not implemented)", async () => {
            mockConfigService.get.mockResolvedValue({
                view: { type: "Folder" },
            });

            await expect(viewService.refresh()).rejects.toThrow("Not implemented - refreshFolderView");
        });
    });
});

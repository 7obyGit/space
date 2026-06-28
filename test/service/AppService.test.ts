import "reflect-metadata";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { container } from "tsyringe";
import { AppService } from "../../src/service/AppService.js";
import { PathService } from "../../src/service/fs/PathService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { Result } from "../../src/types/Result.js";

describe("AppService", () => {
    let appService: AppService;
    let mockPathService: any;
    let mockJsonService: any;

    beforeEach(() => {
        container.clearInstances();

        mockPathService = {
            join: vi.fn((...args) => args.join("/")),
            getCurrentWorkingDirectory: vi.fn(() => "/cwd"),
        };

        mockJsonService = {
            load: vi.fn(),
        };

        container.registerInstance(PathService, mockPathService);
        container.registerInstance(JsonService, mockJsonService);
        appService = container.resolve(AppService);
        
        vi.clearAllMocks();
    });

    describe("getVersion", () => {
        it("should return version from package.json", async () => {
            mockJsonService.load.mockResolvedValue(Result.success({ version: "1.2.3" }));
            
            const version = await appService.getVersion();
            
            expect(version).toBe("1.2.3");
            expect(mockPathService.join).toHaveBeenCalledWith("/cwd", "package.json");
        });

        it("should throw error if package.json fails to load", async () => {
            mockJsonService.load.mockResolvedValue(Result.error("Load failed"));
            
            await expect(appService.getVersion()).rejects.toThrow("Failed to read package version");
        });
    });
});

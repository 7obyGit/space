import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigService } from "../../src/service/ConfigService.js";
import { FileService } from "../../src/service/fs/FileService.js";
import { LinkService } from "../../src/service/fs/LinkService.js";
import { PathService } from "../../src/service/fs/PathService.js";
import { JsonService } from "../../src/service/JsonService.js";
import { LoggerService } from "../../src/service/LoggerService.js";
import { SpaceService } from "../../src/service/SpaceService.js";
import { GitService } from "../../src/service/GitService.js";
import { Result } from "../../src/types/Result.js";
import type { ISavedSpace } from "../../src/types/Space.js";

describe("SpaceService Relative Paths", () => {
    let spaceService: SpaceService;
    let mockConfigService: any;
    let mockFileService: any;
    let mockJsonService: any;
    let mockLoggerService: any;
    let mockLinkService: any;
    let mockGitService: any;

    beforeEach(() => {
        container.clearInstances();

        mockConfigService = { get: vi.fn() };
        mockLinkService = { create: vi.fn() };
        mockGitService = {
            isSameRepo: vi.fn().mockResolvedValue(false),
            getGitRoot: vi.fn().mockResolvedValue(undefined),
        };
        mockFileService = {
            exists: vi.fn(),
            createDirectory: vi.fn(),
            listFiles: vi.fn(),
            delete: vi.fn(),
            isFile: vi.fn(),
        };
        mockJsonService = { load: vi.fn(), save: vi.fn() };
        mockLoggerService = { warn: vi.fn(), info: vi.fn() };

        container.registerInstance(ConfigService, mockConfigService);
        container.registerInstance(FileService, mockFileService);
        container.registerSingleton(PathService, PathService);
        container.registerInstance(JsonService, mockJsonService);
        container.registerInstance(LoggerService, mockLoggerService);
        container.registerInstance(LinkService, mockLinkService);
        container.registerInstance(GitService, mockGitService);

        spaceService = container.resolve(SpaceService);

        vi.clearAllMocks();
    });

    describe("Loading a workspace with relative paths", () => {
        it("should make relative paths absolute relative to the workspace file", async () => {
            const workspacePath = "/home/user/project/my.code-workspace";
            const savedSpace: ISavedSpace = {
                folders: [
                    { path: "src" },
                    { path: "../other/lib" },
                    { path: "/absolute/path" }
                ],
                space: {
                    attachedFiles: [
                        "docs/readme.md",
                        "../config/settings.json"
                    ]
                }
            };

            mockConfigService.get.mockResolvedValue({
                active: { path: workspacePath }
            });
            mockFileService.exists.mockResolvedValue(true);
            mockJsonService.load.mockResolvedValue(Result.success(savedSpace));

            const loadedSpace = await spaceService.getActive();

            expect(loadedSpace).toBeDefined();
            expect(loadedSpace!.folders[0].path).toBe("/home/user/project/src");
            expect(loadedSpace!.folders[1].path).toBe("/home/user/other/lib");
            expect(loadedSpace!.folders[2].path).toBe("/absolute/path");
            expect(loadedSpace!.space.attachedFiles[0]).toBe("/home/user/project/docs/readme.md");
            expect(loadedSpace!.space.attachedFiles[1]).toBe("/home/user/config/settings.json");
        });
    });

    describe("Saving a workspace with absolute paths", () => {
        it("should NOT make absolute paths relative if they don't meet criteria", async () => {
            const workspacePath = "/home/user/project/my.code-workspace";
            const loadedSpace: any = {
                folders: [
                    { path: "/other/path/src" }
                ],
                space: {
                    name: "my",
                    path: workspacePath,
                    attachedFiles: [
                        "/another/file.txt"
                    ]
                }
            };

            await (spaceService as any).save(loadedSpace);

            expect(mockJsonService.save).toHaveBeenCalled();
            const savedSpace = mockJsonService.save.mock.calls[0][1];

            expect(savedSpace.folders[0].path).toBe("/other/path/src");
            expect(savedSpace.space.attachedFiles[0]).toBe("/another/file.txt");
        });

        it("should make paths relative if they are in the same git repo", async () => {
            const workspacePath = "/home/user/project/my.code-workspace";
            const targetPath = "/some/external/repo/src";
            const loadedSpace: any = {
                folders: [
                    { path: targetPath }
                ],
                space: {
                    name: "my",
                    path: workspacePath,
                    attachedFiles: []
                }
            };

            mockGitService.isSameRepo.mockImplementation(async (a: string, b: string) => {
                return (a === workspacePath && b === targetPath);
            });

            await (spaceService as any).save(loadedSpace);

            expect(mockJsonService.save).toHaveBeenCalled();
            const savedSpace = mockJsonService.save.mock.calls[0][1];

            expect(savedSpace.folders[0].path).toBe("../../../some/external/repo/src");
        });

        it("should make paths relative if they are beneath the .space parent directory", async () => {
            const projectRoot = "/home/user/project";
            const workspacePath = `${projectRoot}/.space/spaces/my.code-workspace`;
            const targetPath = `${projectRoot}/src/main.ts`;
            
            const loadedSpace: any = {
                folders: [],
                space: {
                    name: "my",
                    path: workspacePath,
                    attachedFiles: [targetPath]
                }
            };

            await (spaceService as any).save(loadedSpace);

            expect(mockJsonService.save).toHaveBeenCalled();
            const savedSpace = mockJsonService.save.mock.calls[0][1];

            expect(savedSpace.space.attachedFiles[0]).toBe("../../src/main.ts");
        });
    });

    describe("Repo-local workspace files", () => {
        it("should handle paths relative to workspace file in .space/spaces/", async () => {
            const projectRoot = "/home/user/project";
            const workspacePath = `${projectRoot}/.space/spaces/my.code-workspace`;
            
            const loadedSpace: any = {
                folders: [
                    { path: projectRoot }
                ],
                space: {
                    name: "my",
                    path: workspacePath,
                    attachedFiles: []
                }
            };

            await (spaceService as any).save(loadedSpace);

            expect(mockJsonService.save).toHaveBeenCalled();
            const savedSpace = mockJsonService.save.mock.calls[0][1];

            expect(savedSpace.folders[0].path).toBe("../..");
        });
    });
});

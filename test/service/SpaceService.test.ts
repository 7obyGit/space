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

describe("SpaceService", () => {
    let spaceService: SpaceService;
    let mockConfigService: any;
    let mockFileService: any;
    let mockPathService: any;
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
            getRemoteUrl: vi.fn().mockResolvedValue(undefined),
            clone: vi.fn().mockResolvedValue(undefined),
        };
        mockFileService = {
            exists: vi.fn(),
            createDirectory: vi.fn(),
            listFiles: vi.fn(),
            delete: vi.fn(),
            isFile: vi.fn(),
            copy: vi.fn().mockResolvedValue(Result.success(undefined)),
            write: vi.fn(),
        };
        mockPathService = {
            join: vi.fn((...args) => args.join("/")),
            getParents: vi.fn(() => []),
            getParent: vi.fn((p) => p.split("/").slice(0, -1).join("/") || "/"),
            getCurrentWorkingDirectory: vi.fn(() => "/cwd"),
            getName: vi.fn((p, ext) => {
                const name = p.split("/").pop() || "";
                if (ext && name.endsWith(ext)) {
                    return name.slice(0, -ext.length);
                }
                return name;
            }),
            getExtension: vi.fn(() => ".json"),
            toAbsolute: vi.fn((p) => p),
            isAbsolute: vi.fn((p) => p.startsWith("/")),
            toRelative: vi.fn((from, to) => to),
        };
        mockJsonService = { load: vi.fn(), save: vi.fn() };
        mockLoggerService = { warn: vi.fn(), info: vi.fn() };

        container.registerInstance(ConfigService, mockConfigService);
        container.registerInstance(FileService, mockFileService);
        container.registerInstance(PathService, mockPathService);
        container.registerInstance(JsonService, mockJsonService);
        container.registerInstance(LoggerService, mockLoggerService);
        container.registerInstance(LinkService, mockLinkService);
        container.registerInstance(GitService, mockGitService);

        spaceService = container.resolve(SpaceService);

        vi.clearAllMocks();
    });

    describe("getActivePath", () => {
        it("should return active path from config", async () => {
            mockConfigService.get.mockResolvedValue({
                active: { path: "active-path" },
            });
            const path = await spaceService.getActivePath();
            expect(path).toBe("active-path");
        });
    });

    describe("list", () => {
        it("should return list of loaded spaces", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(
                Result.success(["space1.json"]),
            );
            mockJsonService.load.mockResolvedValue(
                Result.success({ folders: [] }),
            );
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const spaces = await spaceService.list();

            expect(spaces.length).toBe(2); // One for spaces, one for .space/spaces (mocked join makes them distinct)
            expect(mockJsonService.load).toHaveBeenCalled();
        });
    });

    describe("create", () => {
        it("should create a new space", async () => {
            mockConfigService.get.mockResolvedValue({
                active: { path: "active" },
            });
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValueOnce(false); // get(name) -> undefined
            mockFileService.exists.mockResolvedValueOnce(true); // exists(spacesPath) -> true
            mockFileService.exists.mockResolvedValueOnce(true); // get(name) again -> loaded

            mockFileService.listFiles.mockResolvedValue(
                Result.success(["new.code-workspace"]),
            );
            mockJsonService.load.mockResolvedValue(
                Result.success({ space: { name: "new" } }),
            );
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const space = await spaceService.create("new");

            expect(space.space.name).toBe("new");
            expect(mockJsonService.save).toHaveBeenCalled();
        });

        it("should return existing space if it already exists", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(
                Result.success(["existing.code-workspace"]),
            );
            mockJsonService.load.mockResolvedValue(
                Result.success({ space: { name: "existing" } }),
            );

            const space = await spaceService.create("existing");

            expect(space.space.name).toBe("existing");
            expect(mockLoggerService.warn).toHaveBeenCalledWith(
                expect.stringContaining("already exists"),
            );
        });
    });

    describe("init", () => {
        it("should initialize a new space in the current directory", async () => {
            const cwd = "/current/dir";
            mockPathService.getCurrentWorkingDirectory.mockReturnValue(cwd);
            mockPathService.getName.mockReturnValue("dir");
            mockConfigService.get.mockResolvedValue({
                active: { path: "active" },
            });
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const space = await spaceService.init();

            expect(space.space.name).toBe("dir");
            expect(space.folders).toContainEqual({ path: cwd });
            expect(mockFileService.createDirectory).toHaveBeenCalledWith(
                expect.stringContaining(".space/spaces"),
            );
            expect(mockJsonService.save).toHaveBeenCalledWith(
                expect.stringContaining("dir.code-workspace"),
                expect.objectContaining({
                    folders: [{ path: cwd }],
                }),
            );
        });
    });

    describe("use", () => {
        it("should switch to a new space", async () => {
            const activePath = "/active/path";
            const newPath = "/path/new";
            const newSpace = { space: { name: "new", path: newPath } };
            const oldSpace = { space: { name: "old", path: "/path/old" } };

            vi.spyOn(spaceService, "get").mockResolvedValue(newSpace as any);
            vi.spyOn(spaceService, "getActive").mockResolvedValue(
                oldSpace as any,
            );
            mockConfigService.get.mockResolvedValue({
                active: { path: activePath },
            });
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.use("new");

            expect(result.isSuccess()).toBe(true);
            expect(mockJsonService.save).toHaveBeenCalledWith(
                activePath,
                expect.anything(),
            );
        });

        it("should return error if new space does not exist", async () => {
            vi.spyOn(spaceService, "get").mockResolvedValue(undefined);
            mockFileService.exists.mockResolvedValue(false);
            const result = await spaceService.use("missing");
            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain(
                "No space with name or path 'missing' exists",
            );
        });

        it("should switch to a new space by path", async () => {
            const activePath = "/active/path";
            const newPath = "/path/new.code-workspace";
            const newSpace = { space: { name: "new", path: newPath } };
            const oldSpace = { space: { name: "old", path: "/path/old" } };

            vi.spyOn(spaceService, "get").mockResolvedValue(undefined);
            mockFileService.exists.mockResolvedValue(true);
            mockJsonService.load.mockResolvedValue(Result.success(newSpace));
            vi.spyOn(spaceService, "getActive").mockResolvedValue(
                oldSpace as any,
            );
            mockConfigService.get.mockResolvedValue({
                active: { path: activePath },
            });
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.use(newPath);

            expect(result.isSuccess()).toBe(true);
            expect(mockJsonService.save).toHaveBeenCalledWith(
                activePath,
                expect.anything(),
            );
            expect(result.getValue()!.space.path).toBe(newPath);
        });

        it("should return error if active space has no name", async () => {
            const newSpace = { space: { name: "new", path: "/path/new" } };
            const oldSpace = { space: { path: "/path/old" } }; // Missing name

            vi.spyOn(spaceService, "get").mockResolvedValue(newSpace as any);
            vi.spyOn(spaceService, "getActive").mockResolvedValue(
                oldSpace as any,
            );

            const result = await spaceService.use("new");

            expect(result.isError()).toBe(true);
            expect(result.getError()).toContain("No name present");
        });
    });

    describe("delete", () => {
        it("should return success false if space doesn't exist", async () => {
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            const result = await spaceService.delete("missing");
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(false);
        });

        it("should return success false if space is active", async () => {
            const activePath = "/cwd/spaces/active.code-workspace";
            mockConfigService.get.mockResolvedValue({
                active: { path: activePath },
            });
            mockPathService.getParents.mockReturnValue(["/cwd"]);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(
                Result.success([activePath]),
            );
            mockJsonService.load.mockResolvedValue(
                Result.success({ space: { name: "active" } }),
            );

            const result = await spaceService.delete("active");

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(false);
            expect(mockLoggerService.warn).toHaveBeenCalledWith(
                expect.stringContaining("currently active"),
            );
        });
    });

    describe("Attached Files", () => {
        it("should add a file to attachedFiles and sync", async () => {
            const activePath = "/active/path";
            const space = {
                space: {
                    name: "myspace",
                    path: "/some/path.code-workspace",
                    attachedFiles: [],
                },
                folders: [],
            };

            vi.spyOn(spaceService, "getActive").mockResolvedValue(space as any);
            vi.spyOn(spaceService, "getActivePath").mockResolvedValue(
                activePath,
            );
            mockFileService.isFile.mockResolvedValue(true);
            mockFileService.exists.mockResolvedValue(false); // tmp dir does not exist
            mockLinkService.create.mockResolvedValue(Result.success(undefined));
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.addFolderToActive("test.txt");

            expect(result.isSuccess()).toBe(true);
            expect(space.space.attachedFiles).toContain("test.txt");
            expect(space.folders).toContainEqual({
                path: "/tmp/space/myspace",
                name: "Attached Files",
            });
            expect(mockLinkService.create).toHaveBeenCalled();
        });

        it("should remove from both folders and attachedFiles", async () => {
            const activePath = "/active/path";
            const target = "/target";
            const space = {
                space: {
                    name: "myspace",
                    path: "/some/path.code-workspace",
                    attachedFiles: [target],
                },
                folders: [{ path: target }],
            };

            vi.spyOn(spaceService, "getActive").mockResolvedValue(space as any);
            vi.spyOn(spaceService, "getActivePath").mockResolvedValue(
                activePath,
            );
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            await spaceService.removeFolderFromActive(target);

            expect(
                space.folders.filter((f) => (f as any).path === target).length,
            ).toBe(0);
            expect(space.space.attachedFiles).not.toContain(target);
        });
    });

    describe("clone", () => {
        it("should create a scratch space from a git repo", async () => {
            const gitRoot = "/git-root";
            const remoteUrl = "https://github.com/user/my-repo.git";
            mockPathService.getCurrentWorkingDirectory.mockReturnValue("/cwd");
            mockGitService.getGitRoot.mockResolvedValue(gitRoot);
            mockGitService.getRemoteUrl.mockResolvedValue(remoteUrl);
            mockGitService.clone.mockResolvedValue(undefined);
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.clone();

            expect(result).toContain("/tmp/space/");
            expect(result).toContain("scratch.code-workspace");
            expect(mockGitService.clone).toHaveBeenCalledWith(
                remoteUrl,
                expect.stringContaining("/my-repo"),
            );
            expect(mockGitService.clone).not.toHaveBeenCalledWith(
                remoteUrl,
                expect.stringContaining("/repo"),
            );
            expect(mockJsonService.save).toHaveBeenCalled();
            const savedContent = mockJsonService.save.mock.calls[0][1];
            expect(savedContent.space.source.type).toBe("git");
            expect(savedContent.space.source.url).toBe(remoteUrl);
            expect(savedContent.space.scripts).toBeDefined();
            expect(savedContent.space.scripts["git-status"]).toBe("git status");
        });

        it("should create a scratch space from a directory if not a git repo", async () => {
            mockPathService.getCurrentWorkingDirectory.mockReturnValue(
                "/cwd/my-project",
            );
            mockGitService.getGitRoot.mockResolvedValue(undefined);
            mockFileService.copy.mockResolvedValue(Result.success(undefined));
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.clone();

            expect(result).toContain("/tmp/space/");
            expect(mockFileService.copy).toHaveBeenCalledWith(
                "/cwd/my-project",
                expect.stringContaining("/my-project"),
            );
            const savedContent = mockJsonService.save.mock.calls[0][1];
            expect(savedContent.space.source.type).toBe("directory");
        });

        it("should create a scratch space from a provided URL", async () => {
            const url = "https://github.com/user/other-repo.git";
            mockPathService.getCurrentWorkingDirectory.mockReturnValue("/cwd");
            mockGitService.clone.mockResolvedValue(undefined);
            mockJsonService.save.mockResolvedValue(Result.success(undefined));

            const result = await spaceService.clone(url);

            expect(result).toContain("/tmp/space/");
            expect(mockGitService.clone).toHaveBeenCalledWith(
                url,
                expect.stringContaining("/other-repo"),
            );
            const savedContent = mockJsonService.save.mock.calls[0][1];
            expect(savedContent.space.source.type).toBe("git");
            expect(savedContent.space.source.url).toBe(url);
        });
    });

    describe("scratch", () => {
        it("should create an empty scratch space with a README", async () => {
            mockJsonService.save.mockResolvedValue(Result.success(undefined));
            mockFileService.write.mockResolvedValue(Result.success(undefined));

            const { workspacePath, readmePath } = await spaceService.scratch();

            expect(workspacePath).toContain("/tmp/space/");
            expect(workspacePath).toContain("scratch.code-workspace");
            expect(readmePath).toContain("/work/README.md");

            expect(mockFileService.createDirectory).toHaveBeenCalledWith(
                expect.stringContaining("/work"),
            );
            expect(mockFileService.write).toHaveBeenCalledWith(
                readmePath,
                expect.stringContaining("Scratch Space"),
            );
            expect(mockJsonService.save).toHaveBeenCalled();
            const savedContent = mockJsonService.save.mock.calls[0][1];
            expect(savedContent.folders).toContainEqual({
                path: expect.stringContaining("/work"),
            });
            expect(savedContent.space.scripts["workspace-info"]).toBe(
                "space info",
            );
        });
    });
});

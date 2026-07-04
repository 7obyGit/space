# Scratch Spaces

Scratch spaces provide a temporary workspace that is not saved permanently in your local spaces directory. They are ideal for making safe changes, experimenting, or reviewing code without affecting your active workspace or other saved spaces.

## Creating a Scratch Space

To create a new scratch space from a Git repository or local directory, run:

```bash
space clone [url]
```

To create a completely clean slate scratch space, run:

```bash
space scratch
```

### How `space clone` works:

1. **Detection**: If a `url` is provided, `space` uses it as the source. Otherwise, it checks if the current working directory is part of a Git repository.
2. **Copying**:
    - If it's a **Git repository**, `space` finds the remote URL and clones it into a new temporary directory in `/tmp/space/<uuid>/`.
    - If it's **not a repository**, `space` simply copies the current working directory into the temporary directory.
3. **Workspace Generation**: A new `.code-workspace` file is generated within the temporary directory. This workspace is completely independent of your "active" workspace.
4. **Attached Files**: An "Attached Files" folder is created inside the scratch space, containing a symlink to the scratch workspace file itself for easy access.
5. **Metadata**: Information about the source (Git URL or local path) is saved in the `space` section of the workspace file.
6. **Automatic Open**: The new scratch workspace is automatically opened in a new VS Code window.

### How `space scratch` works:

1. **Initialization**: `space` creates a new temporary directory in `/tmp/space/<uuid>/`.
2. **Setup**:
    - A `work` folder is created as the primary workspace folder.
    - A `README.md` is generated inside the `work` folder with instructions and information about the scratch space.
3. **Workspace Generation**: A new `.code-workspace` file is generated, including the `work` folder and an `attached-files` folder.
4. **Automatic Open**: The new scratch workspace and the `README.md` file are automatically opened in VS Code.

## Using Scratch Spaces

Once inside a scratch space, you can use all standard `space` commands.

## Cleanup

Since scratch spaces are stored in `/tmp/space/`, they are typically cleared by your operating system upon reboot. You can also manually delete the directories in `/tmp/space/` when you no longer need them.

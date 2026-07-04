# Scratch Spaces

Scratch spaces provide a temporary workspace that is not saved permanently in your local spaces directory. They are ideal for making safe changes, experimenting, or reviewing code without affecting your active workspace or other saved spaces.

## Creating a Scratch Space

To create a new scratch space, run:

```bash
space clone
```

### How it works:

1. **Detection**: `space` checks if the current working directory is part of a Git repository.
2. **Copying**:
    - If it's a **Git repository**, `space` finds the remote URL and clones it into a new temporary directory in `/tmp/space/<uuid>/`.
    - If it's **not a repository**, `space` simply copies the current working directory into the temporary directory.
3. **Workspace Generation**: A new `.code-workspace` file is generated within the temporary directory. This workspace is completely independent of your "active" workspace.
4. **Attached Files**: An "Attached Files" folder is created inside the scratch space, containing a symlink to the scratch workspace file itself for easy access.
5. **Metadata**: Information about the source (Git URL or local path) is saved in the `space` section of the workspace file.
6. **Automatic Open**: The new scratch workspace is automatically opened in a new VS Code window.

## Using Scratch Spaces

Once inside a scratch space, you can use all standard `space` commands. Scratch spaces come pre-configured with useful helper scripts.

### Helper Scripts

You can run common commands using `space run <name>`:

- `space run status`: Run `git status`
- `space run diff`: Run `git diff`
- `space run log`: Show the last 10 git commits
- `space run install`: Run `npm install`
- `space run test`: Run `npm test`
- `space run build`: Run `npm run build`

## Cleanup

Since scratch spaces are stored in `/tmp/space/`, they are typically cleared by your operating system upon reboot. You can also manually delete the directories in `/tmp/space/` when you no longer need them.

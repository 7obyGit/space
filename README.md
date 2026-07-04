# space

## Setup

- This project uses `aw` for script management:
    - `npm install -g aw`
    - `aw run space list` (to test running the `space list` command)

## Concepts

- "active workspace file" is always at the same path
- Other workspace files are "swapped out" at the active workspace location by space
- Space commands modify the active workspace
- `space add <path>` works with directories (added to workspace file as a folder) and files (added to an "attached files" directory already present within the workspace)

## Rough Plan

- `./spaces/*` or `./.space/spaces/*` contains spaces
- Scans up the directory tree looking for space dirs, thereby working in subdirectories and supports inheritance of more generic spaces
- Attached files are referenced in the code-workspace file, and a tmp dir is created with symlinks to the listed files, dynamically add the tmp directory to the currently loaded space

## Features

- `space env`
- **Scripts & Hooks**: Support for custom scripts and hooks in workspace files. See [docs/scripts.md](docs/scripts.md) for details.

## Ideas

- Command to auto-install all extension recommendations - perhaps support for auto enabling and disabling installed extensions based on wanted / unwanted ones
- `space init --view=workspace` command (first time setup with options)
- Relative space support, if path is below or is current workspace dir, use relative path instead (e.g. for repos)

## TODO

- Scratch space - in `/tmp` and in new vscode window

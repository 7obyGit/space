# space

## Installation

To install `space` globally, run:

```bash
npm install -g @7obygit/space
```

See [docs/installation.md](docs/installation.md) for more details.

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

- `space env`: View resolved environment variables for the active space. See [docs/env.md](docs/env.md) for details.
- `space init`: Initialize a new space in the current directory.
- `space clone`: Create a temporary scratch space from a Git repo or directory. See [docs/scratch.md](docs/scratch.md) for details.
- `space scratch`: Create a clean slate temporary scratch space. See [docs/scratch.md](docs/scratch.md) for details.
- **Scripts & Hooks**: Support for custom scripts and hooks in workspace files. See [docs/scripts.md](docs/scripts.md) for details.
- **Relative Path Support**: Workspace files automatically use relative paths for folders and attached files when possible, making them portable across different machines and repository clones.

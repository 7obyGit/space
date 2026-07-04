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
- **Scripts & Hooks**: Support for custom scripts and hooks in workspace files. See [docs/scripts.md](docs/scripts.md) for details.
- **Relative Path Support**: Workspace files automatically use relative paths for folders and attached files when possible, making them portable across different machines and repository clones.

## Ideas

- Command to auto-install all extension recommendations - perhaps support for auto enabling and disabling installed extensions based on wanted / unwanted ones

## TODO

- Workspace name config (setting to make it show up correctly in vscode)

The intention for "scratch" spaces is to provide a temporary workspace, which will not be saved permanently
to make changes safely without affecting anything

`space clone` -> check if in git repo, if so, get url, clone in to a `/tmp/space/<uuid>/` directory
generate a workspace file for it, which should be completely independent of the "active" workspace
there should be an "attached files" folder, like normal, but this time create the folder inside the tmp directory with the cloned repo
add a symlink to the actual workspace file in the attached files folder (and put in the attached files section of the workspace file for good measure)

If it is not a repo, then simply make a copy of the cwd in the tmp folder

Gather info about the source and add to the "space" section of the workspace file

Finally, open the created scratch workspace in a new vscode window

Add useful scripts to the scratch space so i can run:

- `space run <name>` -> run useful helper script for scratch spaces
- Any scripts which might be useful - basically just create a bunch of draft suggeetions (all fairly simple) that i can pick from to add

Add docs for scratch spaces

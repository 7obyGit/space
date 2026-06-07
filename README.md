# space

## Concepts

- "active workspace file" is always at the same path
- Other workspace files are "swapped out" at the active workspace location by space
- Space commands modify the active workspace
- `space add <path>` works with directories (added to workspace file as a folder) and files (added to an "attached files" directory already present within the workspace)

## Rough Plan

- `./spaces/*` or `./.space/spaces/*` contains spaces
- Scans up the directory tree looking for space dirs, thereby working in subdirectories and supports inheritance of more generic spaces
- Attached files are referenced in the code-workspace file, and a tmp dir is created with symlinks to the listed files, dynamically add the tmp directory to the currently loaded space

## Ideas

- `aw` integration
- `space run ...` + `space env ...`? - something along the lines of support for env
- Custom hooks, e.g. defined in workspace file a bit like "scripts" section of `package.json` -> support for running script on load of workspace, on close, etc
- Command to auto-install all extension recommendations - perhaps support for auto enabling and disabling installed extensions based on wanted / unwanted ones
- `space init --view=workspace` command (first time setup with options)

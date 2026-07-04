# Concepts & Internals

This document explains the core concepts and internal workings of `space`.

## Core Concepts

- **Active Workspace File**: `space` maintains a single workspace file at a fixed path. VS Code can always point to this file.
- **Dynamic Swapping**: Other workspace configurations are stored separately and "swapped out" at the active workspace location by `space`.
- **Active Workspace Modification**: Most `space` commands modify the active workspace state.
- **Directory vs. File Handling**: 
  - `space add <path>` with a directory adds it as a folder to the workspace.
  - `space add <path>` with a file adds it to an "attached files" directory within the workspace.

## Implementation Details (Rough Plan)

- **Storage**: Spaces are typically stored in `./spaces/*` or `./.space/spaces/*`.
- **Discovery**: The tool scans up the directory tree looking for space directories, allowing it to work in subdirectories and support inheritance of more generic spaces.
- **Attached Files**: These are referenced in the `.code-workspace` file. A temporary directory is created with symlinks to the listed files, and this directory is dynamically added to the currently loaded space.

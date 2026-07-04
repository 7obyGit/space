# 🚀 space

[![npm version](https://img.shields.io/npm/v/@7obygit/space.svg)](https://www.npmjs.com/package/@7obygit/space)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/7obyGit/space.svg?style=social)](https://github.com/7obyGit/space/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/7obyGit/space.svg?style=social)](https://github.com/7obyGit/space/network/members)

`space` is a powerful CLI tool for managing dynamic VS Code workspaces. It allows you to quickly switch between different project contexts, manage environment variables, and attach files to your workspace on the fly.

## 📦 Quick Install

Install `space` globally using npm:

```bash
npm install -g @7obygit/space
```

## 🚀 Getting Started

1. **Initialize a space**: Navigate to your project directory and run:

    ```bash
    space init
    ```

2. **Open in VS Code**: Launch your dynamic workspace:

    ```bash
    space open
    ```

3. **Add folders**: Add the current directory or other paths to your space:
    ```bash
    space add .
    ```

## 🛠 Commands

| Command               | Description                                                        |
| :-------------------- | :----------------------------------------------------------------- |
| `space`               | Show information about the current active space (alias for `info`) |
| `space init`          | Initialize a new space in the current directory                    |
| `space create <name>` | Create a new space                                                 |
| `space delete <name>` | Delete a space                                                     |
| `space use <name>`    | Switch to a different workspace                                    |
| `space add [path]`    | Add a folder to the active space                                   |
| `space remove <path>` | Remove a folder from the active space                              |
| `space pop`           | Remove the first folder from the active space                      |
| `space info`          | Show information about the current active space                    |
| `space config`        | Output all loaded config as JSON                                   |
| `space list`          | List all available spaces                                          |
| `space open`          | Open the active workspace in VS Code                               |
| `space clone <repo>`  | Create a temporary scratch space from a Git repo                   |
| `space scratch`       | Create a clean slate scratch space                                 |
| `space env`           | Show environment variables for the active space                    |
| `space run <script>`  | Run a script defined in the active workspace file                  |

Run `space --help` or `space <command> --help` for more details on specific options.

## ✨ Features

- **Dynamic Workspaces**: Seamlessly switch between different project contexts.
- **Environment Management**: View and manage environment variables per space.
- **Scratch Spaces**: Quickly create temporary workspaces from Git repos or clean slates.
- **Scripts & Hooks**: Automate your workflow with custom scripts.
- **Attached Files**: Link individual files directly into your workspace.
- **Relative Path Support**: Portable workspace files that work across different machines.

## 💡 Key Concepts

- **Active Workspace**: `space` maintains an "active workspace file" that VS Code can always point to.
- **Dynamic Swapping**: When you switch spaces, `space` swaps the content of the active workspace location.
- **Attached Files**: Dynamically link individual files into your workspace without adding their entire parent directories.

See [Concepts & Internals](./docs/concepts.md) for more details.

## 📚 Documentation

Detailed guides can be found in the [docs](./docs) folder:

- [Installation Guide](./docs/installation.md)
- [Environment Variables](./docs/env.md)
- [Scratch Spaces](./docs/scratch.md)
- [Scripts & Hooks](./docs/scripts.md)
- [Concepts & Internals](./docs/concepts.md)

## 📄 License

This project is licensed under the MIT License.

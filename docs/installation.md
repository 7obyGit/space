# Installation

## Pre-requisites

- Node.js (v18 or higher recommended)
- npm

## First-time installation

To install `space` globally, run:

```bash
npm install -g @7obygit/space
```

This will make the `space` command available anywhere on your system.

## Development Installation

If you're developing `space` locally and want changes to be reflected immediately without reinstalling:

1. Clone the repository and navigate to the project directory:

    ```bash
    git clone <repository-url>
    cd space
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Link the package globally:
    ```bash
    npm link
    ```

This creates a symlink from your global `node_modules` to your local development directory. Any changes you make will be
available immediately when running the `space` command.

To unlink the development version later:

Once installed, you can run `space` from any directory:

```bash
space --help
```

## Updating

To update to the latest version, run:

```bash
npm install -g @7obygit/space@latest
```

### Scripts Feature

The `space` tool supports custom scripts and command hooks defined directly within your `.code-workspace` files.
This allows you to automate workflows when interacting with different workspaces.

#### Configuration

Scripts are defined in the `space.scripts` section of your workspace file.

```json
{
    "folders": [],
    "settings": {},
    "space": {
        "scripts": {
            "install": "npm install",
            "test": {
                "pre-command": "echo 'Starting tests...'",
                "command": "npm test",
                "post-command": "echo 'Tests finished!'"
            }
        }
    }
}
```

#### Script Formats

Scripts can be defined in two ways:

1.  **Simple String**: Maps a script name directly to a shell command.
    ```json
    "build": "npm run build"
    ```
2.  **Object Mapping**: Provides finer control with hooks.
    - `pre-command`: Runs before the main command.
    - `command`: The primary command to execute, does not override built-in commands but is run before.
    - `post-command`: Runs after the main command.

#### Command Hooks

If a script name matches a built-in `space` command (e.g., `open`, `add`, `use`, `info`), it acts as a hook for that command.

- `pre-command` will execute **before** the built-in logic.
- `command` will execute **after** `pre-command` and **before** the built-in logic.
- `post-command` will execute **after** the built-in logic.

A **simple string** script matching a command name is treated as a `command` hook.

Example for `space open`:

```json
"open": {
  "pre-command": "echo 'Preparing to open...'",
  "command": "echo 'Opening now...'",
  "post-command": "echo 'Workspace opened!'"
}
```

Or simply:

```json
"open": "echo 'Running before open'"
```

#### Special Scripts

##### The `close` Script

The `close` script is a special hook that runs automatically when a space is being "swapped out" by the `space use` command. This is useful for cleaning up resources, stopping background processes, or saving state before switching to a new workspace.

```json
"close": "docker-compose down"
```

#### Running Scripts

To invoke a script explicitly, use the `run` command:

```bash
space run <script-name>
```

Note that scripts matching built-in command names are automatically invoked as hooks (see [Command Hooks](#command-hooks)).

#### Environment Variables

Scripts are executed with the environment variables defined in your workspace configuration.
For more details on how to configure and use environment variables, see the [Environment Variables](./env.md) documentation.

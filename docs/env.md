### Environment Variables

The `space` tool allows you to define environment variables for your workspaces.
These variables are automatically made available to your [scripts](./scripts.md) and can be viewed using the `space env` command.

#### Configuration

Environment variables are defined in the `space.env` section of your `.code-workspace` file.

```json
{
    "space": {
        "env": {
            "PROJECT_ID": "my-cool-project",
            "DEBUG": "true"
        }
    }
}
```

#### Variable Types

`space` supports two types of environment variables:

1.  **Static Variables**: Simple key-value pairs where the value is a string.
    ```json
    "PROJECT_ID": "my-cool-project"
    ```
2.  **Dynamic Variables**: Variables whose values are determined at runtime by executing a command.
    ```json
    "API_KEY": { "command": "pass show api/key" }
    ```

#### Dynamic Variables & Secrets

Dynamic variables are particularly useful for handling secrets and sensitive information.
Instead of hardcoding an API key or password in your workspace configuration, you can use a command to retrieve it from a secure store at runtime.

Example using `pass`:
```json
"DATABASE_PASSWORD": { "command": "pass show db/production/password" }
```

Example using AWS CLI:
```json
"AWS_TOKEN": { "command": "aws secretsmanager get-secret-value --secret-id my-token --query SecretString --output text" }
```

This approach ensures that secrets are never stored in plain text within your repository or workspace files.
The command is executed every time the environment is resolved, ensuring you always have the latest value.

#### Viewing Environment Variables

You can view the fully resolved environment variables for the active space using the `space env` command:

```bash
space env
```

This will display a table of all environment variables and their resolved values.
This is invaluable for debugging dynamic variables or checking exactly what will be passed to your scripts.

To get the output in JSON format, use the `--json` flag:

```bash
space env --json
```

#### Integration with `aw`

Scripts in `space` are executed using the [`aw`](https://github.com/7obyGit/aw) CLI tool.
`aw` has its own logic for loading environment variables (e.g. from `.env` files), which complements the `space.env` configuration.

The variables defined in your `space.env` configuration are resolved by `space` and then passed directly to `aw`.
This ensures that your dynamic commands are executed and their values are available alongside any variables `aw` discovers on its own.

#### Referencing Variables in Scripts

Once defined, these environment variables can be referenced in your scripts using standard shell syntax.

```json
{
    "space": {
        "env": {
            "APP_PORT": "8080"
        },
        "scripts": {
            "start": "node app.js --port $APP_PORT"
        }
    }
}
```

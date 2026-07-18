const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

// TSLint has not been updated for TypeScript 7. Keep its parser on the
// supported TypeScript 6 API while the project itself type-checks with TS7.
const originalLoad = Module._load;
const legacyTypeScript = require.resolve("typescript-legacy");
Module._load = function (request, parent, isMain) {
    if (request === "typescript") {
        return originalLoad(legacyTypeScript, parent, isMain);
    }
    return originalLoad(request, parent, isMain);
};

const { Linter } = require("tslint");

const fix = process.argv.includes("--fix");
const root = path.resolve(__dirname, "..");
const config = Linter.findConfiguration(
    path.join(root, "tslint.json"),
    root,
).results;

function collectTypeScriptFiles(directory) {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                return entry.name === "node_modules"
                    ? []
                    : collectTypeScriptFiles(entryPath);
            }
            return entry.name.endsWith(".ts") ? [entryPath] : [];
        });
}

const linter = new Linter({ fix, formatter: "prose" });
for (const filePath of collectTypeScriptFiles(path.join(root, "src"))) {
    linter.lint(filePath, fs.readFileSync(filePath, "utf8"), config);
}

const result = linter.getResult();
process.stdout.write(result.output);
process.exitCode = result.errorCount > 0 ? 1 : 0;

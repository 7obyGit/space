import { exec } from "node:child_process";
import { singleton } from "tsyringe";
import { Result, type TResult } from "../types/Result.js";
import type { ITerminalResult } from "../types/Terminal.js";

@singleton()
export class TerminalService {
    public async run(command: string): Promise<TResult<ITerminalResult, string>> {
        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                if (error && error.code === undefined) {
                    resolve(Result.error(`Failed to execute command: ${error.message}`));
                    return;
                }

                const result: ITerminalResult = {
                    stdout,
                    stderr,
                    exitCode: error ? (error.code ?? 1) : 0,
                };

                resolve(Result.success(result));
            });
        });
    }
}

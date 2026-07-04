export interface ITerminalResult {
    stdout: string;
    stderr: string;
    exitCode: number | string | null;
}

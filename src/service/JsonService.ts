import { readFile } from "node:fs";
import { Result, TResult } from "../types/Result.js";
import JSON5 from "json5";
import { FileService, TPath } from "./FileService.js";

export type IValidationResult = {
    valid: boolean;
    errors: string[];
};
export type TJsonValidator = (obj: unknown) => IValidationResult;

export class JsonService {
    public static async load<TJson>(
        path: TPath,
        validator?: TJsonValidator,
    ): Promise<TResult<TJson, string>> {
        const contentResult: TResult<string, string> =
            await FileService.read(path);
        if (contentResult.isError()) {
            return Result.error(contentResult.getError()!);
        }

        return this.parse(contentResult.getValue()!, validator);
    }

    public static async save<TJson>(
        path: TPath,
        obj: TJson,
    ): Promise<TResult<void, string>> {
        const stringifyResult: TResult<string, string> = this.stringify(obj);
        if (stringifyResult.isError()) {
            return Result.error(stringifyResult.getError()!);
        }

        return await FileService.write(path, stringifyResult.getValue()!);
    }

    public static parse<TJson>(
        text: string,
        validator?: TJsonValidator,
    ): TResult<TJson, string> {
        try {
            const unknownObject: unknown = JSON5.parse(text);

            let validationResult: IValidationResult = {
                valid: true,
                errors: [],
            };
            if (validator !== undefined) {
                validationResult = validator(unknownObject);
            }

            if (validationResult.valid === true) {
                const validatedResult: TJson = unknownObject as TJson;
                return Result.success(validatedResult);
            } else {
                return Result.error(
                    `Failed to parse:\n\n\`\`\`\n${text}\n\`\`\`\n\nParse Errors:\n - ${validationResult.errors.join("\n - ")}`,
                );
            }
        } catch (error) {
            return Result.error(`Failed to parse '${text}' - error: ${error}`);
        }
    }

    public static stringify<TJson>(
        obj: TJson,
        pretty: boolean = true,
    ): TResult<string, string> {
        try {
            const space: 4 | undefined = pretty ? 4 : undefined;
            const text: string = JSON.stringify(obj, null, space);
            return Result.success(text);
        } catch (error) {
            return Result.error(
                `Failed to stringify '${obj}' to JSON - error: ${error}`,
            );
        }
    }
}

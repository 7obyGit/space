export type TSuccessResult<TSuccess> = Result<TSuccess, undefined>;
export type TErrorResult<TError> = Result<undefined, TError>;
export type TResult<TSuccess, TError> =
    | TSuccessResult<TSuccess>
    | TErrorResult<TError>;

export type TSuccessHandler<TSuccess, TResult> = (value: TSuccess) => TResult;
export type TErrorHandler<TError, TResult> = (error: TError) => TResult;

export class Result<TSuccess, TError> {
    private readonly value?: TSuccess = undefined;
    private readonly error?: TError = undefined;

    private constructor(value?: TSuccess, error?: TError) {
        if (value === undefined && error === undefined) {
            throw new Error(
                `Attempted to create result with empty value (${value}) and error (${error})`,
            );
        }
    }

    public static success<TSuccess>(value: TSuccess): TSuccessResult<TSuccess> {
        return new Result(value, undefined);
    }

    public static error<TError>(error: TError): TErrorResult<TError> {
        return new Result(undefined, error);
    }

    public isSuccess(): boolean {
        return this.value !== undefined;
    }

    public isError(): boolean {
        return this.error !== undefined;
    }

    public getValue(errorHandler?: TErrorHandler<TError, undefined>): TSuccess {
        if (this.isError()) {
            // Ideally a user would throw a custom error in the error handler
            if (errorHandler !== undefined) {
                errorHandler(this.error!);
            }

            // Fall back on this if no error has been thrown yet
            throw new Error(
                `Could not get result value as an error occurred: ${this.error}`,
            );
        }

        return this.value!;
    }

    public getError(): TError | undefined {
        return this.error;
    }

    public match<TSuccessHandlerOutput, TErrorHandlerOutput>(
        successHandler: TSuccessHandler<TSuccess, TSuccessHandlerOutput>,
        errorHandler: TErrorHandler<TError, TErrorHandlerOutput>,
    ): TSuccessHandlerOutput | TErrorHandlerOutput {
        if (this.isSuccess()) {
            return successHandler(this.value!);
        } else {
            return errorHandler(this.error!);
        }
    }
}

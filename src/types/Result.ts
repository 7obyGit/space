export type TSuccessResult<TSuccess> = Result<TSuccess, undefined>;
export type TErrorResult<TError> = Result<undefined, TError>;
export type TResult<TSuccess, TError> =
    TSuccessResult<TSuccess> | TErrorResult<TError>;

export type TSuccessHandler<TSuccess, TOutput> = (value: TSuccess) => TOutput;
export type TErrorHandler<TError, TOutput> = (error: TError) => TOutput;

export class Result<TSuccess, TError> {
    public static success<TSuccess>(value: TSuccess): TSuccessResult<TSuccess> {
        return new Result(true, value, undefined) as TSuccessResult<TSuccess>;
    }

    public static error<TError>(error: TError): TErrorResult<TError> {
        return new Result(false, undefined, error) as TErrorResult<TError>;
    }
    private readonly value?: TSuccess = undefined;
    private readonly error?: TError = undefined;
    private readonly isSuccessStatus: boolean;

    private constructor(isSuccess: boolean, value?: TSuccess, error?: TError) {
        this.isSuccessStatus = isSuccess;
        this.value = value;
        this.error = error;
    }

    public isSuccess(): boolean {
        return this.isSuccessStatus;
    }

    public isError(): boolean {
        return !this.isSuccessStatus;
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

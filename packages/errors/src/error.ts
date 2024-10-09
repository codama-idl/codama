/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 */

import { CodamaErrorCode } from './codes';
import { CodamaErrorContext } from './context';
import { getErrorMessage } from './message-formatter';

export function isCodamaError<TErrorCode extends CodamaErrorCode>(
    e: unknown,
    code?: TErrorCode,
): e is CodamaError<TErrorCode> {
    const isCodamaError = e instanceof Error && e.name === 'CodamaError';
    if (isCodamaError) {
        if (code !== undefined) {
            return (e as CodamaError<TErrorCode>).context.__code === code;
        }
        return true;
    }
    return false;
}

type CodamaErrorCodedContext = Readonly<{
    [P in CodamaErrorCode]: (CodamaErrorContext[P] extends undefined ? object : CodamaErrorContext[P]) & {
        __code: P;
    };
}>;

export class CodamaError<TErrorCode extends CodamaErrorCode = CodamaErrorCode> extends Error {
    readonly context: CodamaErrorCodedContext[TErrorCode];
    constructor(
        ...[code, contextAndErrorOptions]: CodamaErrorContext[TErrorCode] extends undefined
            ? [code: TErrorCode, errorOptions?: ErrorOptions | undefined]
            : [code: TErrorCode, contextAndErrorOptions: CodamaErrorContext[TErrorCode] & (ErrorOptions | undefined)]
    ) {
        let context: CodamaErrorContext[TErrorCode] | undefined;
        let errorOptions: ErrorOptions | undefined;
        if (contextAndErrorOptions) {
            // If the `ErrorOptions` type ever changes, update this code.
            const { cause, ...contextRest } = contextAndErrorOptions;
            if (cause) {
                errorOptions = { cause };
            }
            if (Object.keys(contextRest).length > 0) {
                context = contextRest as CodamaErrorContext[TErrorCode];
            }
        }
        const message = getErrorMessage(code, context);
        super(message, errorOptions);
        this.context = {
            __code: code,
            ...context,
        } as CodamaErrorCodedContext[TErrorCode];
        // This is necessary so that `isCodamaError()` can identify a `CodamaError` without having
        // to import the class for use in an `instanceof` check.
        this.name = 'CodamaError';
    }
}

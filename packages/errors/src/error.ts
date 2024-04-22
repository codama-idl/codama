/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 */

import { KinobiErrorCode } from './codes';
import { KinobiErrorContext } from './context';
import { getErrorMessage } from './message-formatter';

export function isKinobiError<TErrorCode extends KinobiErrorCode>(
    e: unknown,
    code?: TErrorCode,
): e is KinobiError<TErrorCode> {
    const isKinobiError = e instanceof Error && e.name === 'KinobiError';
    if (isKinobiError) {
        if (code !== undefined) {
            return (e as KinobiError<TErrorCode>).context.__code === code;
        }
        return true;
    }
    return false;
}

type KinobiErrorCodedContext = Readonly<{
    [P in KinobiErrorCode]: (KinobiErrorContext[P] extends undefined ? object : KinobiErrorContext[P]) & {
        __code: P;
    };
}>;

export class KinobiError<TErrorCode extends KinobiErrorCode = KinobiErrorCode> extends Error {
    readonly context: KinobiErrorCodedContext[TErrorCode];
    constructor(
        ...[code, contextAndErrorOptions]: KinobiErrorContext[TErrorCode] extends undefined
            ? [code: TErrorCode, errorOptions?: ErrorOptions | undefined]
            : [code: TErrorCode, contextAndErrorOptions: KinobiErrorContext[TErrorCode] & (ErrorOptions | undefined)]
    ) {
        let context: KinobiErrorContext[TErrorCode] | undefined;
        let errorOptions: ErrorOptions | undefined;
        if (contextAndErrorOptions) {
            // If the `ErrorOptions` type ever changes, update this code.
            const { cause, ...contextRest } = contextAndErrorOptions;
            if (cause) {
                errorOptions = { cause };
            }
            if (Object.keys(contextRest).length > 0) {
                context = contextRest as KinobiErrorContext[TErrorCode];
            }
        }
        const message = getErrorMessage(code, context);
        super(message, errorOptions);
        this.context = {
            __code: code,
            ...context,
        } as KinobiErrorCodedContext[TErrorCode];
        // This is necessary so that `isKinobiError()` can identify a `KinobiError` without having
        // to import the class for use in an `instanceof` check.
        this.name = 'KinobiError';
    }
}

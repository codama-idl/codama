/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 */

export function safeCaptureStackTrace(...args: Parameters<typeof Error.captureStackTrace>): void {
    if ('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(...args);
    }
}

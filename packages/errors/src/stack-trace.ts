/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/solana-web3.js/blob/main/packages/errors
 */

export function safeCaptureStackTrace(...args: Parameters<typeof Error.captureStackTrace>): void {
    if ('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(...args);
    }
}

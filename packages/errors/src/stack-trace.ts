/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

export function safeCaptureStackTrace(...args: Parameters<typeof Error.captureStackTrace>): void {
    if ('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(...args);
    }
}

/**
 * Log an error message to the console, e.g. when a renderer or a CLI command
 * hits a failure it reports without throwing.
 *
 * @param message - The message to log.
 *
 * @example
 * ```ts
 * logError('Failed to format the generated code.');
 * ```
 */
export function logError(message: string) {
    console.error(message);
}

/**
 * Log a warning message to the console, e.g. when a renderer falls back to a
 * default because some input is missing.
 *
 * @param message - The message to log.
 *
 * @example
 * ```ts
 * logWarn('No package.json found, skipping dependency checks.');
 * ```
 */
export function logWarn(message: string) {
    console.warn(message);
}

/**
 * Log an informational message to the console.
 *
 * @param message - The message to log.
 *
 * @example
 * ```ts
 * logInfo('Generated 12 files.');
 * ```
 */
export function logInfo(message: string) {
    console.log(message);
}

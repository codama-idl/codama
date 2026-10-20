/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import { CodamaErrorCode } from './codes';
import { encodeContextObject, isNonEmptyNodePath } from './context';
import { CodamaErrorMessages } from './messages';
import { formatContextPath, getNodePathString } from './node-path';

export function getHumanReadableErrorMessage<TErrorCode extends CodamaErrorCode>(
    code: TErrorCode,
    context: object = {},
): string {
    return formatErrorMessage(CodamaErrorMessages[code], context);
}

/**
 * Interpolate the values of an error context into a message format string.
 *
 * `$key` renders the value of `key` in the context, and is left as is when the context has no such
 * key. Node paths render as node selectors, e.g. `[programNode]token.[accountNode]mint`, and lists
 * of node paths as lists of node selectors, e.g. `[[accountNode]a, [accountNode]b]`. An empty
 * `path` renders as `none`.
 *
 * @example
 * ```ts
 * formatErrorMessage('Missing account $path.', { path: [root, program, account] });
 * // "Missing account [programNode]token.[accountNode]mint."
 * ```
 */
export function formatErrorMessage(messageFormatString: string, context: object): string {
    return messageFormatString.replace(/(?<!\\)\$(\w+)/g, (substring, variableName: string) => {
        if (!(variableName in context)) return substring;
        return formatContextValue(variableName, context[variableName as keyof typeof context]);
    });
}

/**
 * Render a context value. Node paths render as node selectors, using the same detection as when
 * encoding production contexts, so decoded production messages match development ones.
 */
function formatContextValue(key: string, value: unknown): string {
    if (key === 'path' || isNonEmptyNodePath(value)) return formatContextPath(value);
    if (Array.isArray(value) && value.length > 0 && value.every(isNonEmptyNodePath)) {
        return `[${value.map(getNodePathString).join(', ')}]`;
    }
    return `${value as string}`;
}

export function getErrorMessage<TErrorCode extends CodamaErrorCode>(code: TErrorCode, context: object = {}): string {
    if (process.env.NODE_ENV !== 'production') {
        return getHumanReadableErrorMessage(code, context);
    } else {
        let decodingAdviceMessage = `Codama error #${code}; Decode this error by running \`npx @codama/errors decode -- ${code}`;
        if (Object.keys(context).length) {
            /**
             * DANGER: Be sure that the shell command is escaped in such a way that makes it
             *         impossible for someone to craft malicious context values that would result in
             *         an exploit against anyone who bindly copy/pastes it into their terminal.
             */
            decodingAdviceMessage += ` '${encodeContextObject(context)}'`;
        }
        return `${decodingAdviceMessage}\``;
    }
}

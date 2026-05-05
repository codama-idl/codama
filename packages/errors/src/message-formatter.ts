/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import { CodamaErrorCode } from './codes';
import { encodeContextObject } from './context';
import { CodamaErrorMessages } from './messages';

export function getHumanReadableErrorMessage<TErrorCode extends CodamaErrorCode>(
    code: TErrorCode,
    context: object = {},
): string {
    const messageFormatString = CodamaErrorMessages[code];
    // Missing context vars render as empty string so optional fields (e.g. argumentPath) don't
    // leak `$varname` literals into messages. This is safe because callers control both the
    // template and context shape via CodamaErrorContext.
    const message = messageFormatString.replace(/(?<!\\)\$(\w+)/g, (_substring, variableName) =>
        variableName in context ? `${context[variableName as keyof typeof context] as string}` : '',
    );
    return message;
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

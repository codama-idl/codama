/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 */

import { KinobiErrorCode } from './codes';
import { encodeContextObject } from './context';
import { KinobiErrorMessages } from './messages';

export function getHumanReadableErrorMessage<TErrorCode extends KinobiErrorCode>(
    code: TErrorCode,
    context: object = {},
): string {
    const messageFormatString = KinobiErrorMessages[code];
    const message = messageFormatString.replace(/(?<!\\)\$(\w+)/g, (substring, variableName) =>
        variableName in context ? `${context[variableName as keyof typeof context]}` : substring,
    );
    return message;
}

export function getErrorMessage<TErrorCode extends KinobiErrorCode>(code: TErrorCode, context: object = {}): string {
    if (process.env.NODE_ENV !== 'production') {
        return getHumanReadableErrorMessage(code, context);
    } else {
        let decodingAdviceMessage = `Kinobi error #${code}; Decode this error by running \`npx @codama/errors decode -- ${code}`;
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

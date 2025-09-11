/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/anza-xyz/kit/blob/main/packages/errors
 */

import { Command, InvalidArgumentError } from 'commander';
import pico from 'picocolors';

import { version } from '../../package.json';
import { CodamaErrorCode } from '../codes';
import { decodeEncodedContext } from '../context';
import { getHumanReadableErrorMessage } from '../message-formatter';
import { CodamaErrorMessages } from '../messages';

const program = new Command();

program.name('@codama/errors').description('Decode Codama JavaScript errors thrown in production').version(version);

program
    .command('decode')
    .description('Decode a `CodamaErrorCode` to a human-readable message')
    .argument('<code>', 'numeric error code to decode', rawCode => {
        const code = parseInt(rawCode, 10);
        if (isNaN(code) || `${code}` !== rawCode) {
            throw new InvalidArgumentError('It must be an integer');
        }
        if (!(code in CodamaErrorMessages)) {
            throw new InvalidArgumentError('There exists no error with that code');
        }
        return code;
    })
    .argument('[encodedContext]', 'encoded context to interpolate into the error message', encodedContext => {
        try {
            return decodeEncodedContext(encodedContext);
        } catch {
            throw new InvalidArgumentError('Encoded context malformed');
        }
    })
    .action((code: number, context: object | undefined) => {
        const header = codamaColor(pico.bold('[Decoded]') + ` Codama error code #${code}`);
        const message = getHumanReadableErrorMessage(code as CodamaErrorCode, context);
        console.log(`\n${header}\n    ${message}`);
        if (context) {
            const contextHeader = pico.blue(pico.bold('[Context]'));
            const contextString = JSON.stringify(context, null, 4).split('\n').join('\n    ');
            console.log(`\n${contextHeader}\n    ${contextString}`);
        }
    });

export function run(argv: readonly string[]) {
    program.parse(argv);
}

function codamaColor(text: string): string {
    if (!pico.isColorSupported) return text;
    return `\x1b[38;2;231;171;97m${text}\x1b[0m`;
}

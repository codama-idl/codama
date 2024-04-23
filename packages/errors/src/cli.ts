/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 */

import chalk from 'chalk';
import { Command, InvalidArgumentError } from 'commander';

import { version } from '../package.json';
import { KinobiErrorCode } from './codes';
import { decodeEncodedContext } from './context';
import { getHumanReadableErrorMessage } from './message-formatter';
import { KinobiErrorMessages } from './messages';

const program = new Command();

program.name('@kinobi-so/errors').description('Decode Kinobi JavaScript errors thrown in production').version(version);

program
    .command('decode')
    .description('Decode a `KinobiErrorCode` to a human-readable message')
    .argument('<code>', 'numeric error code to decode', rawCode => {
        const code = parseInt(rawCode, 10);
        if (isNaN(code) || `${code}` !== rawCode) {
            throw new InvalidArgumentError('It must be an integer');
        }
        if (!(code in KinobiErrorMessages)) {
            throw new InvalidArgumentError('There exists no error with that code');
        }
        return code;
    })
    .argument('[encodedContext]', 'encoded context to interpolate into the error message', encodedContext => {
        try {
            return decodeEncodedContext(encodedContext);
        } catch (e) {
            throw new InvalidArgumentError('Encoded context malformed');
        }
    })
    .action((code: number, context) => {
        const message = getHumanReadableErrorMessage(code as KinobiErrorCode, context);
        console.log(`
${
    chalk.bold(
        chalk.rgb(154, 71, 255)('[') +
            chalk.rgb(144, 108, 244)('D') +
            chalk.rgb(134, 135, 233)('e') +
            chalk.rgb(122, 158, 221)('c') +
            chalk.rgb(110, 178, 209)('o') +
            chalk.rgb(95, 195, 196)('d') +
            chalk.rgb(79, 212, 181)('e') +
            chalk.rgb(57, 227, 166)('d') +
            chalk.rgb(19, 241, 149)(']'),
    ) + chalk.rgb(19, 241, 149)(' Kinobi error code #' + code)
}
    - ${message}`);
        if (context) {
            console.log(`
${chalk.yellowBright(chalk.bold('[Context]'))}
    ${JSON.stringify(context, null, 4).split('\n').join('\n    ')}`);
        }
    });

export function run(argv: readonly string[]) {
    program.parse(argv);
}

import { Command } from 'commander';

import { version } from '../../package.json';

const program = new Command();

program.name('kinobi').description('Manage your Kinobi IDLs').version(version);

program
    .command('run')
    .description('Runs a visitor on your Kinobi IDL')
    .argument('<foo>', 'test required argument')
    .argument('[bar]', 'test optional argument')
    .option('-b, --baz <char>', 'test option')
    .action((foo, bar, options) => {
        console.log({ bar, foo, options });
    });

export function run(argv: readonly string[]) {
    program.parse(argv);
}

/**
 * GLOBAL CLI OPTIONS
 *
 * -i, --idl <path> - The path to the Kinobi (or Anchor) IDL file to run the visitor on.
 * --idls <path> - The path of potential additional programs to include.
 * -c, --config <path> - The path to the configuration file to use. Defaults to `kinobi.js|json`.
 * --no-transforms - Disables all configured transformers.
 *
 * CONFIGURATION FILE
 *
 * {
 *   "idl": "./program/idl.json",
 *   "idls": ["./program/idl2.json"],
 *   "transformers": ["./kinobi/myCustomTransformer.js"], // Same concept as below.
 *   "visitors": [
 *     "./kinobi/myCustomVisitor.ts",
 *     ["./kinobi/myCustomVisitorWithOptions.ts", { "key": "value" }],
 *     ["./kinobi/myCustomVisitorWithSingleOption.ts", 123],
 *     "my-visitor-library", // Fetches a plugin function called "install".
 *     "my-visitor-library/render-js", // Fetches a plugin function called "renderJs".
 *     ["my-visitor-library", { "key": "value" }],
 *     ["my-visitor-library/render-js", 123],
 *   ],
 * }
 *
 * CLI COMMAND: run
 *
 * kinobi run <visitor> [options]
 * kinobi run <visitor> -- [options]
 * E.g:
 * kinobi run ./kinobi/myCustomVisitor.ts
 * kinobi run ./kinobi/myCustomVisitor.ts 123
 * kinobi run ./kinobi/myCustomVisitor.ts --key value
 * kinobi run ./kinobi/myCustomVisitor.ts -- --key value // in case of conflict with Kinobi's global options.
 * kinobi run @my-visitor-library [...]
 * kinobi run @my-visitor-library/render-js [...]
 * Shortcuts:
 * kinobi render-js clients/js/src/generated [...] // Delegate to "kinobi run @kinobi-so/renderers-js [...]"
 * kinobi render-rust clients/rust/src/generated [...] // Delegate to "kinobi run @kinobi-so/renderers-rust [...]"
 *
 * CLI COMMAND: apply-transforms
 *
 * kinobi apply-transforms [outfile]
 * E.g:
 * kinobi apply-transforms // Applies all transformers, overwrites the input file and resets the transformers array from the config.
 * kinobi apply-transforms my-applied-idl.json // Applies all transformers and writes the output to the specified file without modifying the config.
 *
 * CLI COMMAND: fetch-idl
 *
 * kinobi fetch-idl <programAddress> [outfile]
 * E.g:
 * kinobi fetch-idl 1234..5678 // Fetches the Kinobi IDL from the specified program and outputs it to the console.
 * kinobi fetch-idl 1234..5678 my-fetched-idl.json // Same but writes it to the specified file and updates the config, if any.
 *
 * kinobi apply-transforms [outfile]
 * E.g:
 * kinobi apply-transforms // Applies all transformers, overwrites the input file and resets the transformers array from the config.
 * kinobi apply-transforms my-applied-idl.json // Applies all transformers and writes the output to the specified file without modifying the config.
 *
 * FUTURE CLI COMMAND: fetch-account
 *
 * kinobi fetch-account <accountId> [outfile]
 * E.g:
 * kinobi fetch-account 1234..5678 // Fetches the account data and the Kinobi IDL of its owner program in order to deserialize it. Outputs to the console.
 * kinobi fetch-account 1234..5678 // Same but writes it to the specified file.
 */

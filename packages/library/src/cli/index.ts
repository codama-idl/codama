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

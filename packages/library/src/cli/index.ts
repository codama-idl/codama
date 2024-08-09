import { Command } from 'commander';

import { version } from '../../package.json';

const program = new Command();

program.name('kinobi').description('Manage your Kinobi IDLs').version(version);

program
    .command('run')
    .description('Runs a visitor on your Kinobi IDL')
    .argument('<test>', 'test argument', (code?: number) => {
        return code ?? 42;
    })
    .action((test: number, context) => {
        console.log({ context, test });
    });

export function run(argv: readonly string[]) {
    program.parse(argv);
}

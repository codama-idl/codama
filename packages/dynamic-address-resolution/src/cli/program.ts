import { Command } from 'commander';

import { registerCommands } from './commands';

export function createProgram(): Command {
    const program = new Command();

    program
        .name('dynamic-address-resolution')
        .description('CLI for @codama/dynamic-address-resolution')
        .showHelpAfterError(true);

    registerCommands(program);
    return program;
}

import { Command } from 'commander';

import { registerCommands } from './commands';

export function createProgram(): Command {
    const program = new Command();

    program.name('dynamic-client').description('CLI for @codama/dynamic-client').showHelpAfterError(true);

    registerCommands(program);
    return program;
}

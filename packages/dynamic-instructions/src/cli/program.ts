import { Command } from 'commander';

import { registerCommands } from './commands';

export function createProgram(): Command {
    const program = new Command();

    program.name('dynamic-instructions').description('CLI for @codama/dynamic-instructions').showHelpAfterError(true);

    registerCommands(program);
    return program;
}

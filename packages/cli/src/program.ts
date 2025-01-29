import { Command, createCommand } from 'commander';

import { setInitCommand, setRunCommand } from './commands';
import { setProgramOptions } from './programOptions';

export async function codama(args: string[], opts?: { suppressOutput?: boolean }): Promise<void> {
    await createProgram({
        exitOverride: true,
        suppressOutput: opts?.suppressOutput,
    }).parseAsync(args, { from: 'user' });
}

export function createProgram(internalOptions?: { exitOverride?: boolean; suppressOutput?: boolean }): Command {
    const program = createCommand()
        .version(__VERSION__)
        .allowExcessArguments(false)
        .configureHelp({ showGlobalOptions: true, sortOptions: true, sortSubcommands: true });

    // Set program options and commands.
    setProgramOptions(program);
    setInitCommand(program);
    setRunCommand(program);

    // Internal options.
    if (internalOptions?.exitOverride) {
        program.exitOverride();
    }
    if (internalOptions?.suppressOutput) {
        program.configureOutput({
            writeErr: () => {},
            writeOut: () => {},
        });
    }

    return program;
}

import { Command, createCommand, ParseOptions } from 'commander';
import pico from 'picocolors';

import { setInitCommand, setRunCommand } from './commands';
import { setProgramOptions } from './programOptions';
import { logDebug, logError } from './utils';

export async function codama(args: string[], opts?: { suppressOutput?: boolean }): Promise<void> {
    const program = createProgram({
        exitOverride: true,
        suppressOutput: opts?.suppressOutput,
    });
    await runProgram(program, args, { from: 'user' });
}

export async function runProgram(program: Command, argv: readonly string[], parseOptions?: ParseOptions) {
    try {
        await program.parseAsync(argv, parseOptions);
    } catch (err) {
        const error = err as { message: string; stack?: string; items?: string[] };
        if (program.opts().debug) {
            logDebug(`${error.stack}`);
        }
        logError(pico.bold(error.message), error.items ?? []);
        process.exitCode = 1;
    }
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

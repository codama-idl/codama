import { ChildProcess, spawn, SpawnOptions } from 'child_process';

export type ChildCommand = {
    command: string;
    args: string[];
};

export function createChildCommand(command: string, args: string[] = []): ChildCommand {
    return { command, args };
}

export function formatChildCommand(childCommand: ChildCommand): string {
    const { command, args } = childCommand;
    return [command, ...args].join(' ');
}

export type ChildProcessResult = ChildProcess & {
    stdoutString: string;
    stderrString: string;
};

export type ChildProcessError = Error & {
    childProcess: ChildProcessResult;
};

export async function spawnChildCommand(
    childCommand: ChildCommand,
    options: SpawnOptions & { quiet: boolean } = { quiet: false },
): Promise<ChildProcess & { stdoutString: string; stderrString: string }> {
    const { command, args } = childCommand;
    const childProcess = spawn(command, args, options) as ChildProcessResult;
    childProcess.stdoutString = '';
    childProcess.stderrString = '';

    childProcess.stdout?.on('data', (chunk: Uint8Array) => {
        childProcess.stdoutString += chunk.toString();
        if (!options.quiet) {
            process.stdout.write(chunk);
        }
    });
    childProcess.stderr?.on('data', (chunk: Uint8Array) => {
        childProcess.stderrString += chunk.toString();
        if (!options.quiet) {
            process.stderr.write(chunk);
        }
    });

    const exitCode: number = await new Promise((resolve, reject) => {
        childProcess.on('error', () => reject(createChildProcessResultError(childCommand, childProcess)));
        childProcess.on('close', resolve);
    });
    if (exitCode) {
        throw createChildProcessResultError(childCommand, childProcess);
    }

    return childProcess;
}

function createChildProcessResultError(
    childCommand: ChildCommand,
    childProcess: ChildProcessResult,
): ChildProcessError {
    const error = new Error(`Command [${formatChildCommand(childCommand)}] failed`) as ChildProcessError;
    error.childProcess = childProcess;
    return error;
}

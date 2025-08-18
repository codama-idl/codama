import pico from 'picocolors';

import { createProgram } from '../program';
import { logDebug, logError } from '../utils';

const program = createProgram();

export async function run(argv: readonly string[]) {
    try {
        await program.parseAsync(argv);
    } catch (err) {
        const error = err as { message: string; stack?: string; items?: string[] };
        if (program.opts().debug) {
            logDebug(`${error.stack}`);
        }
        logError(pico.bold(error.message), error.items ?? []);
        process.exitCode = 1;
    }
}

import { createProgram } from './program';

const program = createProgram();

export function run(argv: string[]): void {
    // Show help when invoked with no arguments.
    if (argv.length <= 2) {
        program.outputHelp();
        return;
    }

    program.parse(argv);
}

import { createProgram } from './program';

const program = createProgram();

export function run(argv: string[]): void {
    if (argv.length <= 2) {
        program.outputHelp();
        return;
    }

    program.parse(argv);
}

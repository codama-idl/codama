import { createProgram, runProgram } from '@codama/cli';

const program = createProgram();

export async function run(argv: readonly string[]) {
    await runProgram(program, argv);
}

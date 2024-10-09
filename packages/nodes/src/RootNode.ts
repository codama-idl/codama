import type { CodamaVersion, ProgramNode, RootNode } from '@codama/node-types';

export function rootNode<TProgram extends ProgramNode, const TAdditionalPrograms extends ProgramNode[] = []>(
    program: TProgram,
    additionalPrograms?: TAdditionalPrograms,
): RootNode<TProgram, TAdditionalPrograms> {
    return Object.freeze({
        kind: 'rootNode',

        // Data.
        standard: 'codama',
        version: __VERSION__ as CodamaVersion,

        // Children.
        program,
        additionalPrograms: (additionalPrograms ?? []) as TAdditionalPrograms,
    });
}

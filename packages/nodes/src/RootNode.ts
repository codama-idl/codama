import type { KinobiVersion, ProgramNode, RootNode } from '@kinobi-so/node-types';

export function rootNode<TProgram extends ProgramNode, const TAdditionalPrograms extends ProgramNode[] = []>(
    program: TProgram,
    additionalPrograms?: TAdditionalPrograms,
): RootNode<TProgram, TAdditionalPrograms> {
    return Object.freeze({
        kind: 'rootNode',

        // Data.
        standard: 'kinobi',
        version: __VERSION__ as KinobiVersion,

        // Children.
        program,
        additionalPrograms: (additionalPrograms ?? []) as TAdditionalPrograms,
    });
}

import type { ProgramNode, RootNode } from '@codama/node-types';

import { CODAMA_VERSION } from './codamaVersion';

/**
 * The root of a Codama IDL document.
 * Pairs a primary program with any number of additional programs and tags the document with the spec version.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/96c43c75-5925-4b6b-a1e0-8b8c61317cfe)
 */
export function rootNode<
    const TProgram extends ProgramNode,
    const TAdditionalPrograms extends Array<ProgramNode> | undefined = [],
>(
    program: TProgram,
    additionalPrograms: TAdditionalPrograms = [] as Array<ProgramNode> as TAdditionalPrograms,
): RootNode<TProgram, TAdditionalPrograms> {
    return Object.freeze({
        kind: 'rootNode',

        // Data.
        standard: 'codama',
        version: CODAMA_VERSION,

        // Children.
        program,
        ...(additionalPrograms !== undefined &&
            additionalPrograms.length > 0 && { additionalPrograms: additionalPrograms as TAdditionalPrograms }),
    });
}

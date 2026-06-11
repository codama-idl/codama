import type { ProgramNode, RootNode } from '@codama/node-types';
import { CODAMA_VERSION } from './codamaVersion';

/**
 * The root of a Codama IDL document.
 * Pairs a primary program with any number of additional programs and tags the document with the spec version.
 */
export function rootNode<const TProgram extends ProgramNode, const TAdditionalPrograms extends Array<ProgramNode> = []>(
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
        additionalPrograms,
    });
}

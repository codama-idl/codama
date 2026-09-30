import type { PluginNode, ProgramNode, RootNode } from '@codama/node-types';

import { CODAMA_VERSION } from './codamaVersion';

/**
 * The root of a Codama IDL.
 * Pairs a primary program with any number of additional programs and tags the IDL with the spec version.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/96c43c75-5925-4b6b-a1e0-8b8c61317cfe)
 */
export function rootNode<
    const TProgram extends ProgramNode,
    const TAdditionalPrograms extends Array<ProgramNode> | undefined = [],
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    program: TProgram,
    options: {
        additionalPrograms?: TAdditionalPrograms;
        plugins?: TPlugins;
    } = {},
): RootNode<TProgram, TAdditionalPrograms, TPlugins> {
    return Object.freeze({
        kind: 'rootNode',

        // Data.
        standard: 'codama',
        version: CODAMA_VERSION,

        // Children.
        program,
        ...(options.additionalPrograms !== undefined &&
            options.additionalPrograms.length > 0 && {
                additionalPrograms: options.additionalPrograms as TAdditionalPrograms,
            }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

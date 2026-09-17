import type { DefinedTypeLinkNode, PluginNode, ProgramLinkNode, TransformNode } from '@codama/node-types';

import { identifierString } from '../../shared';
import { programLinkNode } from './ProgramLinkNode';

/** A reference to a defined type — possibly in a different program. */
export function definedTypeLinkNode<
    const TProgram extends ProgramLinkNode | undefined = undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    options: {
        program?: TProgram;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): DefinedTypeLinkNode<TProgram, TTransforms, TPlugins> {
    const program = options.program;
    return Object.freeze({
        kind: 'definedTypeLinkNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(program !== undefined && {
            program: (typeof program === 'string' ? programLinkNode(program) : program) as TProgram,
        }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

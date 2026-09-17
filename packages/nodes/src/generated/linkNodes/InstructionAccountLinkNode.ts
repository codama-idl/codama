import type { InstructionAccountLinkNode, InstructionLinkNode, PluginNode } from '@codama/node-types';

import { identifierString } from '../../shared';
import { instructionLinkNode } from './InstructionLinkNode';

/** A reference to an account of another instruction. */
export function instructionAccountLinkNode<
    const TInstruction extends InstructionLinkNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    options: {
        instruction?: TInstruction;
        plugins?: TPlugins;
    } = {},
): InstructionAccountLinkNode<TInstruction, TPlugins> {
    const instruction = options.instruction;
    return Object.freeze({
        kind: 'instructionAccountLinkNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(instruction !== undefined && {
            instruction: (typeof instruction === 'string'
                ? instructionLinkNode(instruction)
                : instruction) as TInstruction,
        }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

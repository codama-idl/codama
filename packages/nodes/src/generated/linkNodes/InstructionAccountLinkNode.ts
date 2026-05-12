import type { InstructionAccountLinkNode, InstructionLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';
import { instructionLinkNode } from './InstructionLinkNode';

/** A reference to an account of another instruction. */
export function instructionAccountLinkNode<const TInstruction extends InstructionLinkNode | undefined = undefined>(
    name: string,
    instruction?: TInstruction | string,
): InstructionAccountLinkNode<TInstruction> {
    return Object.freeze({
        kind: 'instructionAccountLinkNode',

        // Data.
        name: camelCase(name),

        // Children.
        ...(instruction !== undefined && {
            instruction: (typeof instruction === 'string'
                ? instructionLinkNode(instruction)
                : instruction) as TInstruction,
        }),
    });
}

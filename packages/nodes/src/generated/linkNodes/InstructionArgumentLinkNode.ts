import type { InstructionArgumentLinkNode, InstructionLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';
import { instructionLinkNode } from './InstructionLinkNode';

/** A reference to an argument of another instruction. */
export function instructionArgumentLinkNode<const TInstruction extends InstructionLinkNode | undefined = undefined>(
    name: string,
    instruction?: TInstruction | string,
): InstructionArgumentLinkNode<TInstruction> {
    return Object.freeze({
        kind: 'instructionArgumentLinkNode',

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

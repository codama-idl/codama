import type { InstructionAccountDisplayNode } from '@codama/node-types';

export type InstructionAccountDisplayNodeInput = Omit<InstructionAccountDisplayNode, 'kind'>;

/** Display metadata for an instruction account: its label in the fallback list and whether it is shown. */
export function instructionAccountDisplayNode(
    input: InstructionAccountDisplayNodeInput,
): InstructionAccountDisplayNode {
    return Object.freeze({
        kind: 'instructionAccountDisplayNode',

        // Data.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.skip !== undefined && { skip: input.skip }),
    });
}

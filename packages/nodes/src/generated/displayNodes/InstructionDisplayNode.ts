import type { InstructionDisplayNode } from '@codama/node-types';

export type InstructionDisplayNodeInput = Omit<InstructionDisplayNode, 'kind'>;

/**
 * Display metadata for an instruction: a short intent label and an interpolated sentence template.
 * Either form may be absent; presentation strategy is left to the renderer.
 */
export function instructionDisplayNode(input: InstructionDisplayNodeInput): InstructionDisplayNode {
    return Object.freeze({
        kind: 'instructionDisplayNode',

        // Data.
        ...(input.intent !== undefined && { intent: input.intent }),
        ...(input.interpolatedIntent !== undefined && { interpolatedIntent: input.interpolatedIntent }),
    });
}

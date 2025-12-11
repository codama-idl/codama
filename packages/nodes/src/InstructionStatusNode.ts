import type { InstructionLifecycle, InstructionStatusNode } from '@codama/node-types';

export function instructionStatusNode(lifecycle: InstructionLifecycle, message?: string): InstructionStatusNode {
    return Object.freeze({
        kind: 'instructionStatusNode',

        // Data.
        lifecycle,
        ...(message !== undefined && { message }),
    });
}

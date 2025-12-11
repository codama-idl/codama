import type { InstructionStatusNode, InstructionStatus } from '@codama/node-types';

export function instructionStatusNode(
    lifecycle: InstructionStatus,
    message?: string,
): InstructionStatusNode {
    return Object.freeze({
        kind: 'instructionStatusNode',

        // Data.
        lifecycle,
        ...(message !== undefined && { message }),
    });
}

import type { InstructionStatusNode, InstructionStatus } from '@codama/node-types';

export function instructionStatusNode(
    status: InstructionStatus,
    options: { message?: string } = {},
): InstructionStatusNode {
    return Object.freeze({
        kind: 'instructionStatusNode',

        // Data.
        status,
        ...(options.message !== undefined && { message: options.message }),
    });
}

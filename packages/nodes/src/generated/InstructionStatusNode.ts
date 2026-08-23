import type { InstructionLifecycle, InstructionStatusNode } from '@codama/node-types';

/**
 * The lifecycle stage of an instruction (draft, live, deprecated, archived) with an optional accompanying message.
 * An instruction without a status is considered live — a status node is typically only attached to signal another stage.
 */
export function instructionStatusNode(lifecycle: InstructionLifecycle, message?: string): InstructionStatusNode {
    return Object.freeze({
        kind: 'instructionStatusNode',

        // Data.
        lifecycle,
        ...(message !== undefined && { message }),
    });
}

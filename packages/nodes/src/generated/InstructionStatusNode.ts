import type { InstructionLifecycle, InstructionStatusNode } from '@codama/node-types';

/** The lifecycle stage of an instruction (draft, live, deprecated, archived) with an optional accompanying message. */
export function instructionStatusNode(lifecycle: InstructionLifecycle, message?: string): InstructionStatusNode {
    return Object.freeze({
        kind: 'instructionStatusNode',

        // Data.
        lifecycle,
        ...(message !== undefined && { message }),
    });
}

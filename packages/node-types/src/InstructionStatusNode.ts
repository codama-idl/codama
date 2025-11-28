import type { InstructionStatus } from './shared';

export interface InstructionStatusNode {
    readonly kind: 'instructionStatusNode';

    // Data.
    readonly status: InstructionStatus;
    readonly message?: string;
}

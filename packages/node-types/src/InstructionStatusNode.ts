import type { InstructionStatus } from './shared';

export interface InstructionStatusNode {
    readonly kind: 'instructionStatusNode';

    // Data.
    readonly lifecycle: InstructionStatus;
    readonly message?: string;
}

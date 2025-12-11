import type { InstructionLifecycle } from './shared';

export interface InstructionStatusNode {
    readonly kind: 'instructionStatusNode';

    // Data.
    readonly lifecycle: InstructionLifecycle;
    readonly message?: string;
}

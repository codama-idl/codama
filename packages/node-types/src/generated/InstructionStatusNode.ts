import type { InstructionLifecycle } from './shared/instructionLifecycle';

/** The lifecycle stage of an instruction (draft, live, deprecated, archived) with an optional accompanying message. */
export interface InstructionStatusNode {
    readonly kind: 'instructionStatusNode';

    // Data.
    /** The lifecycle stage. */
    readonly lifecycle: InstructionLifecycle;
    /** Free-form prose accompanying the status — e.g. a deprecation notice with migration guidance. */
    readonly message?: string;
}

import type { InstructionByteDeltaValue } from './InstructionByteDeltaValue';

/** A byte-size delta applied when computing rent or buffer size — typically used by instructions that resize accounts. */
export interface InstructionByteDeltaNode<TValue extends InstructionByteDeltaValue = InstructionByteDeltaValue> {
    readonly kind: 'instructionByteDeltaNode';

    // Data.
    /** Whether the delta includes the account header overhead. */
    readonly withHeader: boolean;
    /** When `true`, the delta is subtracted from the running size instead of added. Defaults to `false`. */
    readonly subtract?: boolean;

    // Children.
    /** The source of the delta value — a literal number, a referenced account or argument, or a resolver. */
    readonly value: TValue;
}

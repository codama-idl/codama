import type { InstructionByteDeltaValue } from './InstructionByteDeltaValue';

/**
 * A byte-size delta applied when computing rent or buffer size — typically used by instructions that resize accounts.
 * For instance, if an instruction creates a new account of 42 bytes, this node can carry that information, enabling clients to allocate the right amount of lamports to cover the cost of executing the instruction.
 */
export interface InstructionByteDeltaNode<TValue extends InstructionByteDeltaValue = InstructionByteDeltaValue> {
    readonly kind: 'instructionByteDeltaNode';

    // Data.
    /**
     * Whether the delta includes the account header overhead — i.e. 128 bytes.
     * Defaults to `false` when the value is a `resolverValueNode` and `true` otherwise.
     */
    readonly withHeader: boolean;
    /** When `true`, the delta is subtracted from the running size instead of added. Defaults to `false`. */
    readonly subtract?: boolean;

    // Children.
    /** The source of the delta value — a literal number, a referenced account or argument, or a resolver. */
    readonly value: TValue;
}

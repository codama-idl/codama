import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';

/** Identifies a node by a constant value at a known byte offset (e.g. a magic header). */
export interface ConstantDiscriminatorNode<TConstant extends ConstantValueNode = ConstantValueNode> {
    readonly kind: 'constantDiscriminatorNode';

    // Data.
    /** The byte offset at which the constant begins. */
    readonly offset: number;

    // Children.
    /** The constant value expected at the offset. */
    readonly constant: TConstant;
}

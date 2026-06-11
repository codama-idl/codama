import type { ConstantDiscriminatorNode, ConstantValueNode } from '@codama/node-types';

/** Identifies a node by a constant value at a known byte offset (e.g. a magic header). */
export function constantDiscriminatorNode<const TConstant extends ConstantValueNode>(
    constant: TConstant,
    offset: number = 0,
): ConstantDiscriminatorNode<TConstant> {
    return Object.freeze({
        kind: 'constantDiscriminatorNode',

        // Data.
        offset,

        // Children.
        constant,
    });
}

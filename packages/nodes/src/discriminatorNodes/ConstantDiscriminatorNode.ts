import type { ConstantDiscriminatorNode, ConstantValueNode } from '@kinobi-so/node-types';

export function constantDiscriminatorNode<TConstant extends ConstantValueNode>(
    constant: TConstant,
    offset: number = 0,
): ConstantDiscriminatorNode {
    return Object.freeze({
        kind: 'constantDiscriminatorNode',

        // Data.
        offset,

        // Children.
        constant,
    });
}

import type { ConstantValueNode } from '../valueNodes';

export interface ConstantDiscriminatorNode<TConstant extends ConstantValueNode = ConstantValueNode> {
    readonly kind: 'constantDiscriminatorNode';

    // Data.
    readonly offset: number;

    // Children.
    readonly constant: TConstant;
}

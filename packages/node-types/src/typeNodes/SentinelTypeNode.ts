import type { ConstantValueNode } from '../valueNodes';
import type { TypeNode } from './TypeNode';

export interface SentinelTypeNode<
    TType extends TypeNode = TypeNode,
    TSentinel extends ConstantValueNode = ConstantValueNode,
> {
    readonly kind: 'sentinelTypeNode';

    // Children.
    readonly type: TType;
    readonly sentinel: TSentinel;
}

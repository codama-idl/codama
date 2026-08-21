import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';
import type { TypeNode } from './TypeNode';

/**
 * Wraps another type and delimits it with a constant sentinel value written immediately after the wrapped type.
 *
 * When decoding, the wrapped type is decoded until the sentinel value is encountered, at which point decoding stops and the sentinel is discarded.
 *
 * > [!IMPORTANT]
 * > For this node to work, the sentinel value must never occur within the encoded bytes of the wrapped type.
 */
export interface SentinelTypeNode<
    TType extends TypeNode = TypeNode,
    TSentinel extends ConstantValueNode = ConstantValueNode,
> {
    readonly kind: 'sentinelTypeNode';

    // Children.
    /** The wrapped type whose extent is delimited by the sentinel. */
    readonly type: TType;
    /** The constant value written immediately after the wrapped type to mark its end. */
    readonly sentinel: TSentinel;
}

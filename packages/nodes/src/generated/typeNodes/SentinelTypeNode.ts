import type { ConstantValueNode, SentinelTypeNode, TypeNode } from '@codama/node-types';

/**
 * Wraps another type and delimits it with a constant sentinel value written immediately after the wrapped type.
 *
 * When decoding, the wrapped type is decoded until the sentinel value is encountered, at which point decoding stops and the sentinel is discarded.
 *
 * > [!IMPORTANT]
 * > For this node to work, the sentinel value must never occur within the encoded bytes of the wrapped type.
 */
export function sentinelTypeNode<const TType extends TypeNode, const TSentinel extends ConstantValueNode>(
    type: TType,
    sentinel: TSentinel,
): SentinelTypeNode<TType, TSentinel> {
    return Object.freeze({
        kind: 'sentinelTypeNode',

        // Children.
        type,
        sentinel,
    });
}

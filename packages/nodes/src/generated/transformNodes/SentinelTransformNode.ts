import type { ConstantValueNode, PluginNode, SentinelTransformNode } from '@codama/node-types';

/**
 * Delimits the transformed type with a constant sentinel value written immediately after it.
 *
 * When decoding, the transformed type is decoded until the sentinel value is encountered, at which point decoding stops and the sentinel is discarded.
 *
 * > [!IMPORTANT]
 * > For this transform to work, the sentinel value must never occur within the encoded bytes of the transformed type.
 */
export function sentinelTransformNode<
    const TSentinel extends ConstantValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    sentinel: TSentinel,
    options: {
        plugins?: TPlugins;
    } = {},
): SentinelTransformNode<TSentinel, TPlugins> {
    return Object.freeze({
        kind: 'sentinelTransformNode',

        // Children.
        sentinel,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

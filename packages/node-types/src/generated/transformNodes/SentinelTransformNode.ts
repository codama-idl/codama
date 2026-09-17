import type { PluginNode } from '../PluginNode';
import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';

/**
 * Delimits the transformed type with a constant sentinel value written immediately after it.
 *
 * When decoding, the transformed type is decoded until the sentinel value is encountered, at which point decoding stops and the sentinel is discarded.
 *
 * > [!IMPORTANT]
 * > For this transform to work, the sentinel value must never occur within the encoded bytes of the transformed type.
 */
export interface SentinelTransformNode<
    TSentinel extends ConstantValueNode = ConstantValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'sentinelTransformNode';

    // Children.
    /** The constant value written immediately after the transformed type to mark its end. */
    readonly sentinel: TSentinel;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

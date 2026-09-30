import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';

/** A 32-byte Solana public key. */
export interface PublicKeyTypeNode<
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'publicKeyTypeNode';

    // Children.
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

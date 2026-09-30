import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';

/** A raw sequence of bytes. Typically carries a fixed-size, size-prefix, or sentinel transform to bound its extent. */
export interface BytesTypeNode<
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'bytesTypeNode';

    // Children.
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

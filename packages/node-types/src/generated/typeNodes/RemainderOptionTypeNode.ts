import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { TypeNode } from './TypeNode';

/** A value that may be present or absent. Presence is signalled by whether any bytes remain to be read, with no explicit prefix. */
export interface RemainderOptionTypeNode<
    TItem extends TypeNode = TypeNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'remainderOptionTypeNode';

    // Children.
    /** The type carried by the option when present. */
    readonly item: TItem;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

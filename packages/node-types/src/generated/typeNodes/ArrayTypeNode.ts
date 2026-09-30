import type { CountNode } from '../countNodes/CountNode';
import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { TypeNode } from './TypeNode';

/** A homogeneous list of items. The item type is defined by `item`; the length is determined by the `count` strategy. */
export interface ArrayTypeNode<
    TItem extends TypeNode = TypeNode,
    TCount extends CountNode = CountNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'arrayTypeNode';

    // Children.
    /** The type of each item in the array. */
    readonly item: TItem;
    /** The strategy used to determine the number of items. */
    readonly count: TCount;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

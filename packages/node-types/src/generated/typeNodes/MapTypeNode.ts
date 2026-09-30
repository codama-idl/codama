import type { CountNode } from '../countNodes/CountNode';
import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { TypeNode } from './TypeNode';

/**
 * A keyed map.
 * The key and value types are described by their respective type nodes; the entry count is determined by a count strategy.
 * Entries are serialised one after the other, each key immediately followed by its value — e.g. key A, value A, key B, value B.
 */
export interface MapTypeNode<
    TKey extends TypeNode = TypeNode,
    TValue extends TypeNode = TypeNode,
    TCount extends CountNode = CountNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'mapTypeNode';

    // Children.
    /** The type of each entry key. */
    readonly key: TKey;
    /** The type of each entry value. */
    readonly value: TValue;
    /** The strategy used to determine the number of entries. */
    readonly count: TCount;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

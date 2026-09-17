import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { TypeNode } from './TypeNode';

/** A heterogeneous fixed-length sequence in which each positional slot has its own type. */
export interface TupleTypeNode<
    TItems extends Array<TypeNode> | undefined = Array<TypeNode> | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'tupleTypeNode';

    // Children.
    /** The type of each positional slot, in order. */
    readonly items?: TItems;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { IntegerTypeNode } from './IntegerTypeNode';

/**
 * A boolean serialised as an integer. The inner integer type determines the byte width.
 * A decoded number of `1` yields `true`; any other value yields `false`.
 */
export interface BooleanTypeNode<
    TSize extends IntegerTypeNode = IntegerTypeNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'booleanTypeNode';

    // Children.
    /** The integer type used to serialise the boolean. */
    readonly size: TSize;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

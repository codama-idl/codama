import type { PluginNode } from '../PluginNode';
import type { IntegerTypeNode } from '../typeNodes/IntegerTypeNode';

/**
 * A count strategy where the number of items is read from a numeric prefix.
 * This enables nodes such as `arrayTypeNode` to represent collections whose length is stored as a prefix.
 */
export interface PrefixedCountNode<
    TPrefix extends IntegerTypeNode = IntegerTypeNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'prefixedCountNode';

    // Children.
    /** The integer type used as the count prefix. */
    readonly prefix: TPrefix;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

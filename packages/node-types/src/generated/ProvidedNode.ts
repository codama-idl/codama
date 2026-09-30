import type { IdentifierString } from '../brands';
import type { Node } from './Node';
import type { PluginNode } from './PluginNode';

/**
 * Exposes a node under a key so consumers in the surrounding scope can resolve it.
 * Sits inside a host's `provides` list and pairs with `injectedValueNode` on the consumer side: an injection with the matching key resolves to this entry's `node`.
 * Scoping is lexical: the nearest enclosing `provides` entry for a key wins, shadowing entries from outer scopes.
 */
export interface ProvidedNode<
    TNode extends Node = Node,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'providedNode';

    // Data.
    /** The key under which the node is exposed to consumers. */
    readonly identifier: IdentifierString;

    // Children.
    /** The exposed node. The provider is a transparent pipe — any node may be supplied; the family check happens at the injection point against the consumer's expected family. */
    readonly node: TNode;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

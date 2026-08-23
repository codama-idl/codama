import type { CamelCaseString } from '../brands';
import type { Node } from './Node';

/**
 * Exposes a node under a name so consumers in the surrounding scope can resolve it by that key.
 * Sits inside a host's `provides` list and pairs with `injectedValueNode` on the consumer side: an injection with the matching key resolves to this entry's `node`.
 */
export interface ProvidedNode<TNode extends Node = Node> {
    readonly kind: 'providedNode';

    // Data.
    /** The key under which the node is exposed to consumers. */
    readonly name: CamelCaseString;

    // Children.
    /** The exposed node. The provider is a transparent pipe — any node may be supplied; the family check happens at the injection point against the consumer's expected family. */
    readonly node: TNode;
}

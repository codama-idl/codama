import type { Node, ProvidedNode } from '@codama/node-types';
import { camelCase } from '../shared';

/**
 * Exposes a node under a name so consumers in the surrounding scope can resolve it by that key.
 * Sits inside a host's `provides` list and pairs with `injectedValueNode` on the consumer side: an injection with the matching key resolves to this entry's `node`.
 */
export function providedNode<const TNode extends Node>(name: string, value: TNode): ProvidedNode<TNode> {
    return Object.freeze({
        kind: 'providedNode',

        // Data.
        name: camelCase(name),

        // Children.
        node: value,
    });
}

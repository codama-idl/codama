import type { Node, PluginNode, ProvidedNode } from '@codama/node-types';

import { identifierString } from '../shared';

/**
 * Exposes a node under a key so consumers in the surrounding scope can resolve it.
 * Sits inside a host's `provides` list and pairs with `injectedValueNode` on the consumer side: an injection with the matching key resolves to this entry's `node`.
 * Scoping is lexical: the nearest enclosing `provides` entry for a key wins, shadowing entries from outer scopes.
 */
export function providedNode<
    const TNode extends Node,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    value: TNode,
    options: {
        plugins?: TPlugins;
    } = {},
): ProvidedNode<TNode, TPlugins> {
    return Object.freeze({
        kind: 'providedNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        node: value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

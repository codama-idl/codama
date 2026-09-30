import type { ConstantNode, PluginNode, TextNode, TypeNode, ValueNode } from '@codama/node-types';

import { identifierString } from '../shared';

/** A named constant exposed by the program: a typed value associated with a name. */
export function constantNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TType extends TypeNode = TypeNode,
    const TValue extends ValueNode = ValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    type: TType,
    value: TValue,
    options: {
        docs?: TDocs;
        plugins?: TPlugins;
    } = {},
): ConstantNode<TDocs, TType, TValue, TPlugins> {
    return Object.freeze({
        kind: 'constantNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(options.docs !== undefined && { docs: options.docs }),
        type,
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

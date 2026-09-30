import type { PluginNode, StructFieldValueNode, ValueNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** A named field of a `structValueNode`. */
export function structFieldValueNode<
    const TValue extends ValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    value: TValue,
    options: {
        plugins?: TPlugins;
    } = {},
): StructFieldValueNode<TValue, TPlugins> {
    return Object.freeze({
        kind: 'structFieldValueNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

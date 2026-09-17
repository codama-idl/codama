import type { FieldDiscriminatorNode, PluginNode } from '@codama/node-types';

import { pathString } from '../../shared';

/** Identifies a node by the value of a field at a known byte offset. */
export function fieldDiscriminatorNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    path: string,
    options: {
        offset?: number;
        plugins?: TPlugins;
    } = {},
): FieldDiscriminatorNode<TPlugins> {
    return Object.freeze({
        kind: 'fieldDiscriminatorNode',

        // Data.
        path: pathString(path),
        offset: options.offset ?? 0,

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

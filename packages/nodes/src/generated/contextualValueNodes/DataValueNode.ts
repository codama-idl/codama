import type { DataValueNode, PluginNode } from '@codama/node-types';

import { pathString } from '../../shared';

/** Refers to a value within the data of the surrounding instruction. */
export function dataValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    path: string,
    options: {
        plugins?: TPlugins;
    } = {},
): DataValueNode<TPlugins> {
    return Object.freeze({
        kind: 'dataValueNode',

        // Data.
        path: pathString(path),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

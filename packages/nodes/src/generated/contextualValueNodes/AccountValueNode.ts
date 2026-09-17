import type { AccountValueNode, PluginNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** Refers to a named account in the surrounding instruction. */
export function accountValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    identifier: string,
    options: {
        plugins?: TPlugins;
    } = {},
): AccountValueNode<TPlugins> {
    return Object.freeze({
        kind: 'accountValueNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

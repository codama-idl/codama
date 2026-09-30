import type { AccountBumpValueNode, PluginNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** Refers to the bump seed of a named PDA-derived account in the surrounding instruction. */
export function accountBumpValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    identifier: string,
    options: {
        plugins?: TPlugins;
    } = {},
): AccountBumpValueNode<TPlugins> {
    return Object.freeze({
        kind: 'accountBumpValueNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

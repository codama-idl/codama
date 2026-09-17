import type { AccountDataValueNode, PluginNode } from '@codama/node-types';

import { identifierString, pathString } from '../../shared';

/**
 * Refers to a value within a named account's decoded data.
 * The referenced account must carry an `accountLink` so the account's layout is known.
 * Resolving the value requires reading the account state at presentation time.
 */
export function accountDataValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    account: string,
    options: {
        path?: string;
        plugins?: TPlugins;
    } = {},
): AccountDataValueNode<TPlugins> {
    return Object.freeze({
        kind: 'accountDataValueNode',

        // Data.
        account: identifierString(account),
        ...(options.path !== undefined && { path: pathString(options.path) }),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

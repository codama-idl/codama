import type { AccountDataValueNode, PluginNode } from '@codama/node-types';

import { identifierString, pathString } from '../../shared';

/**
 * Refers to a value within a named account's decoded data.
 * The referenced account must carry an `accountLink` so the account's layout is known.
 * Resolving the value requires reading the account state. When presenting, an unresolvable value falls back as usual. When building an instruction, e.g. for a PDA seed or a default value, there is nothing to fall back to: consumers that cannot or do not read the account must fail explicitly rather than guess.
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

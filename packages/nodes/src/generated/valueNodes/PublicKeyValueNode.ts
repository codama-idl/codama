import type { PluginNode, PublicKeyValueNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** A concrete 32-byte public key, with an optional symbolic identifier for the address. */
export function publicKeyValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    publicKey: string,
    options: {
        identifier?: string;
        plugins?: TPlugins;
    } = {},
): PublicKeyValueNode<TPlugins> {
    return Object.freeze({
        kind: 'publicKeyValueNode',

        // Data.
        publicKey,
        ...(options.identifier !== undefined && { identifier: identifierString(options.identifier) }),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

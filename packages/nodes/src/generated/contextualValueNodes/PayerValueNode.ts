import type { PayerValueNode, PluginNode } from '@codama/node-types';

/**
 * Refers to the wallet paying for the surrounding transaction — the main wallet that should pay for things, such as rent for account storage.
 * For instance, in a web application the payer would be the connected wallet; in a terminal, the wallet identified by `solana address`.
 * A similar node exists for the main wallet that should own things — `identityValueNode`. In practice the identity and the payer are often the same, but offering the distinction can be useful should they differ.
 */
export function payerValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    options: {
        plugins?: TPlugins;
    } = {},
): PayerValueNode<TPlugins> {
    return Object.freeze({
        kind: 'payerValueNode',

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

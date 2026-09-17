import type { PdaSeedValueNode, PdaSeedValueValue, PluginNode } from '@codama/node-types';

import { identifierString } from '../../shared';

/** Pairs a PDA seed name with the value to substitute when deriving the PDA. */
export function pdaSeedValueNode<
    const TValue extends PdaSeedValueValue,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    value: TValue,
    options: {
        plugins?: TPlugins;
    } = {},
): PdaSeedValueNode<TValue, TPlugins> {
    return Object.freeze({
        kind: 'pdaSeedValueNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        value,
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

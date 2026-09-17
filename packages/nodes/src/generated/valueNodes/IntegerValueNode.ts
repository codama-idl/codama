import type { IntegerValueNode, PluginNode } from '@codama/node-types';

import { integerString } from '../../shared';

/**
 * A concrete integer value, stored as a string so the full 64- and 128-bit ranges survive JSON transport losslessly.
 * In memory it maps to a native big integer (`bigint` in JavaScript, `i128`/`u128` in Rust); the surrounding type context narrows it to a specific width.
 */
export function integerValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    value: string,
    options: {
        plugins?: TPlugins;
    } = {},
): IntegerValueNode<TPlugins> {
    return Object.freeze({
        kind: 'integerValueNode',

        // Data.
        value: integerString(value),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

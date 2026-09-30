import type { FloatValueNode, PluginNode } from '@codama/node-types';

import { decimalString } from '../../shared';

/**
 * A concrete floating-point value, stored as a string so round-trips are deterministic across serialisers.
 * The surrounding type context narrows it to a specific width.
 */
export function floatValueNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    value: string,
    options: {
        plugins?: TPlugins;
    } = {},
): FloatValueNode<TPlugins> {
    return Object.freeze({
        kind: 'floatValueNode',

        // Data.
        value: decimalString(value),

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

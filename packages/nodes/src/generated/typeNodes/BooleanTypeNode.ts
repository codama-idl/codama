import type { BooleanTypeNode, IntegerTypeNode, PluginNode, TransformNode } from '@codama/node-types';

import { integerTypeNode } from './IntegerTypeNode';

/**
 * A boolean serialised as an integer. The inner integer type determines the byte width.
 * A decoded number of `1` yields `true`; any other value yields `false`.
 */
export function booleanTypeNode<
    const TSize extends IntegerTypeNode = IntegerTypeNode<'u8'>,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    options: {
        size?: TSize;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): BooleanTypeNode<TSize, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'booleanTypeNode',

        // Children.
        size: (options.size ?? integerTypeNode('u8')) as TSize,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

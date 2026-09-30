import type { IntegerTypeNode, OptionTypeNode, PluginNode, TransformNode, TypeNode } from '@codama/node-types';

import { integerTypeNode } from './IntegerTypeNode';

/** A value that may be present or absent (Some/None), with an explicit numeric prefix indicating presence. */
export function optionTypeNode<
    const TItem extends TypeNode,
    const TPrefix extends IntegerTypeNode = IntegerTypeNode<'u8'>,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    item: TItem,
    options: {
        fixed?: boolean;
        prefix?: TPrefix;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): OptionTypeNode<TItem, TPrefix, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'optionTypeNode',

        // Data.
        fixed: options.fixed ?? false,

        // Children.
        item,
        prefix: (options.prefix ?? integerTypeNode('u8')) as TPrefix,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

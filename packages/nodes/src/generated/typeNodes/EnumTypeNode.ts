import type { EnumTypeNode, EnumVariantTypeNode, IntegerTypeNode, PluginNode, TransformNode } from '@codama/node-types';

import { integerTypeNode } from './IntegerTypeNode';

/** A tagged union: a numeric discriminator followed by one of several variant payloads. */
export function enumTypeNode<
    const TVariants extends Array<EnumVariantTypeNode> | undefined,
    const TSize extends IntegerTypeNode = IntegerTypeNode<'u8'>,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    variants: TVariants,
    options: {
        size?: TSize;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): EnumTypeNode<TVariants, TSize, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'enumTypeNode',

        // Children.
        ...(variants !== undefined && variants.length > 0 && { variants: variants as TVariants }),
        size: (options.size ?? integerTypeNode('u8')) as TSize,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

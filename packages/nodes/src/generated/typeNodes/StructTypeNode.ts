import type { PluginNode, StructFieldTypeNode, StructTypeNode, TransformNode } from '@codama/node-types';

/** A composite type made of an ordered list of named fields. Fields are encoded and decoded in declaration order. */
export function structTypeNode<
    const TFields extends Array<StructFieldTypeNode> | undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    fields: TFields,
    options: {
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): StructTypeNode<TFields, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'structTypeNode',

        // Children.
        ...(fields !== undefined && fields.length > 0 && { fields: fields as TFields }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

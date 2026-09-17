import type {
    ConstantValueNode,
    PluginNode,
    TransformNode,
    TypeNode,
    ZeroableOptionTypeNode,
} from '@codama/node-types';

/** An optional value whose absence is signalled by a designated zero value rather than a presence flag. */
export function zeroableOptionTypeNode<
    const TItem extends TypeNode,
    const TZeroValue extends ConstantValueNode | undefined = undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    item: TItem,
    options: {
        zeroValue?: TZeroValue;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): ZeroableOptionTypeNode<TItem, TZeroValue, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'zeroableOptionTypeNode',

        // Children.
        item,
        ...(options.zeroValue !== undefined && { zeroValue: options.zeroValue }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

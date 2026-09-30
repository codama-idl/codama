import type {
    Endianness,
    IntegerFormat,
    IntegerTypeNode,
    NumberDisplayNode,
    PluginNode,
    TransformNode,
} from '@codama/node-types';

/** An integer with a fixed wire format and byte order. */
export function integerTypeNode<
    const TFormat extends IntegerFormat = IntegerFormat,
    const TDisplay extends NumberDisplayNode | undefined = undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    format: TFormat,
    options: {
        endian?: Endianness;
        unit?: string;
        display?: TDisplay;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): IntegerTypeNode<TFormat, TDisplay, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'integerTypeNode',

        // Data.
        format,
        endian: options.endian ?? 'le',
        ...(options.unit !== undefined && { unit: options.unit }),

        // Children.
        ...(options.display !== undefined && { display: options.display }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

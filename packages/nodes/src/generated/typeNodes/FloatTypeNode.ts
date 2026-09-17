import type {
    Endianness,
    FloatFormat,
    FloatTypeNode,
    PluginNode,
    TransformNode,
    UnitNumberDisplayNode,
} from '@codama/node-types';

/**
 * An IEEE-754 floating-point number with a fixed wire format and byte order.
 * Floating-point numbers are notoriously unsafe for financial values — prefer `fixedPointTypeNode` for those.
 */
export function floatTypeNode<
    const TFormat extends FloatFormat = FloatFormat,
    const TDisplay extends UnitNumberDisplayNode | undefined = undefined,
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
): FloatTypeNode<TFormat, TDisplay, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'floatTypeNode',

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

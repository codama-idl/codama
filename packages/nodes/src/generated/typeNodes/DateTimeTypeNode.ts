import type { DateTimeTypeNode, IntegerTypeNode, PluginNode, TransformNode } from '@codama/node-types';

/** A point in time encoded as an integer count of ticks since the Unix epoch. */
export function dateTimeTypeNode<
    const TNumber extends IntegerTypeNode,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    number: TNumber,
    options: {
        ticksPerSecond?: number;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): DateTimeTypeNode<TNumber, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'dateTimeTypeNode',

        // Data.
        ...(options.ticksPerSecond !== undefined && { ticksPerSecond: options.ticksPerSecond }),

        // Children.
        number,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

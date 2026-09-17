import type { DurationTypeNode, IntegerTypeNode, PluginNode, TransformNode } from '@codama/node-types';

/**
 * An elapsed duration encoded as an integer count of ticks.
 * Renderers typically format the value as `HH:mm:ss` or a coarser human-readable form.
 */
export function durationTypeNode<
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
): DurationTypeNode<TNumber, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'durationTypeNode',

        // Data.
        ...(options.ticksPerSecond !== undefined && { ticksPerSecond: options.ticksPerSecond }),

        // Children.
        number,
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

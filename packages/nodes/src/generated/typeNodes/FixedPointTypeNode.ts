import type {
    FixedPointTypeNode,
    IntegerTypeNode,
    PluginNode,
    TransformNode,
    UnitNumberDisplayNode,
} from '@codama/node-types';

/**
 * A scaled quantity stored as an integer: the value is `raw / base^scale`.
 * Integers are the safe way to carry financial values; this node adds the scaling and unit that give the raw integer its meaning — e.g. token amounts, prices, or binary Q-format fractions.
 */
export function fixedPointTypeNode<
    const TNumber extends IntegerTypeNode,
    const TDisplay extends UnitNumberDisplayNode | undefined = undefined,
    const TTransforms extends Array<TransformNode> | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    number: TNumber,
    scale: number,
    options: {
        base?: 2 | 10;
        unit?: string;
        display?: TDisplay;
        transforms?: TTransforms;
        plugins?: TPlugins;
    } = {},
): FixedPointTypeNode<TNumber, TDisplay, TTransforms, TPlugins> {
    return Object.freeze({
        kind: 'fixedPointTypeNode',

        // Data.
        scale,
        ...(options.base !== undefined && { base: options.base }),
        ...(options.unit !== undefined && { unit: options.unit }),

        // Children.
        number,
        ...(options.display !== undefined && { display: options.display }),
        ...(options.transforms !== undefined &&
            options.transforms.length > 0 && { transforms: options.transforms as TTransforms }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

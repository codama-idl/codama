import type { UnitNumberDisplayNode } from '../displayNodes/UnitNumberDisplayNode';
import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { IntegerTypeNode } from './IntegerTypeNode';

/**
 * A scaled quantity stored as an integer: the value is `raw / base^scale`.
 * Integers are the safe way to carry financial values; this node adds the scaling and unit that give the raw integer its meaning — e.g. token amounts, prices, or binary Q-format fractions.
 */
export interface FixedPointTypeNode<
    TNumber extends IntegerTypeNode = IntegerTypeNode,
    TDisplay extends UnitNumberDisplayNode | undefined = UnitNumberDisplayNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'fixedPointTypeNode';

    // Data.
    /**
     * How many powers of `base` divide the raw integer. An integer value of 12345 with a base-10 scale of 2 represents 123.45.
     * Must be non-zero: an unscaled quantity is an `integerTypeNode` with a `unit`.
     */
    readonly scale: number;
    /** The base the scale applies to. Defaults to `10`; use `2` for binary Q-format fractions. */
    readonly base?: 2 | 10;
    /** The unit of measure the quantity denotes — e.g. `"SOL"`, `"USDC"` or `"%"`. */
    readonly unit?: string;

    // Children.
    /**
     * The integer type used to serialise the raw value — a pure encoding slot.
     * It must use a fixed-size format, because a fixed point presupposes a fixed bit width — most visibly for binary Q-format fractions, whose layout is defined by that width. Variable-size formats such as `shortU16` therefore cannot anchor one.
     * It must not carry a `unit` or `display` of its own.
     */
    readonly number: TNumber;
    /** Display metadata describing how the quantity is presented — a contextual unit resolved via injection on top of the static scale. */
    readonly display?: TDisplay;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

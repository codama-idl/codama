import type { PluginNode } from '../PluginNode';
import type { InjectableIntegerValueNode } from '../valueNodes/InjectableIntegerValueNode';
import type { InjectableStringValueNode } from '../valueNodes/InjectableStringValueNode';

/**
 * Display metadata that presents an integer as a scaled amount with an optional unit, for quantities whose scale is contextual rather than static — e.g. a raw token amount whose decimals live in the mint account.
 * The value is divided by `10 ^ decimals` and rendered alongside `unit` (e.g. `"USDC"`, `"%"`, `"bps"`).
 * Statically scaled quantities belong on the type instead (`fixedPointTypeNode`); for a contextual unit without scaling, use `unitNumberDisplayNode`.
 * When both are present, a resolved display value wins for presentation; the type's static `unit` is the fallback whenever injection cannot resolve.
 */
export interface AmountNumberDisplayNode<
    TDecimals extends InjectableIntegerValueNode = InjectableIntegerValueNode,
    TUnit extends InjectableStringValueNode | undefined = InjectableStringValueNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'amountNumberDisplayNode';

    // Children.
    /**
     * How many decimal places scale the underlying integer. Resolved as an integer value: either a literal `integerValueNode` or a key resolved from a surrounding provider.
     * A value of `1000000` with `decimals` resolving to `6` renders as `1`.
     * When this input cannot resolve, renderers should fall back to presenting the raw value rather than guess the scale.
     */
    readonly decimals: TDecimals;
    /**
     * A label appended after the scaled value (e.g. `"USDC"`, `"%"`, `"bps"`). Resolved as a string value: either a literal `stringValueNode` or a key resolved from a surrounding provider.
     * When this input cannot resolve, renderers should present the scaled value without a unit.
     */
    readonly unit?: TUnit;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

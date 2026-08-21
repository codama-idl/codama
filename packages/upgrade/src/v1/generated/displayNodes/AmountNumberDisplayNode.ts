import type { InjectableNumberValueNode } from '../valueNodes/InjectableNumberValueNode';
import type { InjectableStringValueNode } from '../valueNodes/InjectableStringValueNode';

/**
 * Display metadata that presents a number as a scaled amount with an optional unit.
 * The value is divided by `10 ^ decimals` and rendered alongside `unit` (e.g. `"USDC"`, `"%"`, `"bps"`).
 */
export interface AmountNumberDisplayNode<
    TDecimals extends InjectableNumberValueNode | undefined = InjectableNumberValueNode | undefined,
    TUnit extends InjectableStringValueNode | undefined = InjectableStringValueNode | undefined,
> {
    readonly kind: 'amountNumberDisplayNode';

    // Children.
    /**
     * How many decimal places scale the underlying integer. Resolved as a number value: either a literal `numberValueNode` or a key resolved from a surrounding provider.
     * A value of `1000000` with `decimals` resolving to `6` renders as `1`.
     * When this input cannot resolve, renderers should fall back to presenting the raw value rather than guess the scale.
     */
    readonly decimals?: TDecimals;
    /**
     * A label appended after the scaled value (e.g. `"USDC"`, `"%"`, `"bps"`). Resolved as a string value: either a literal `stringValueNode` or a key resolved from a surrounding provider.
     * When this input cannot resolve, renderers should present the scaled value without a unit.
     */
    readonly unit?: TUnit;
}

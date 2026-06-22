import type { AmountNumberDisplayNode, InjectableNumberValueNode, InjectableStringValueNode } from '@codama/node-types';

export type AmountNumberDisplayNodeInput<
    TDecimals extends InjectableNumberValueNode | undefined = InjectableNumberValueNode | undefined,
    TUnit extends InjectableStringValueNode | undefined = InjectableStringValueNode | undefined,
> = Omit<AmountNumberDisplayNode<TDecimals, TUnit>, 'kind'>;

/**
 * Display metadata that presents a number as a scaled amount with an optional unit.
 * The value is divided by `10 ^ decimals` and rendered alongside `unit` (e.g. `"USDC"`, `"%"`, `"bps"`).
 */
export function amountNumberDisplayNode<
    const TDecimals extends InjectableNumberValueNode | undefined = undefined,
    const TUnit extends InjectableStringValueNode | undefined = undefined,
>(input: AmountNumberDisplayNodeInput<TDecimals, TUnit>): AmountNumberDisplayNode<TDecimals, TUnit> {
    return Object.freeze({
        kind: 'amountNumberDisplayNode',

        // Children.
        ...(input.decimals !== undefined && { decimals: input.decimals }),
        ...(input.unit !== undefined && { unit: input.unit }),
    });
}

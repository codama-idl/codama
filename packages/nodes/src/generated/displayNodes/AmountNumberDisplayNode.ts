import type {
    AmountNumberDisplayNode,
    InjectableIntegerValueNode,
    InjectableStringValueNode,
    PluginNode,
} from '@codama/node-types';

export type AmountNumberDisplayNodeInput<
    TDecimals extends InjectableIntegerValueNode = InjectableIntegerValueNode,
    TUnit extends InjectableStringValueNode | undefined = InjectableStringValueNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<AmountNumberDisplayNode<TDecimals, TUnit, TPlugins>, 'kind'>;

/**
 * Display metadata that presents an integer as a scaled amount with an optional unit, for quantities whose scale is contextual rather than static — e.g. a raw token amount whose decimals live in the mint account.
 * The value is divided by `10 ^ decimals` and rendered alongside `unit` (e.g. `"USDC"`, `"%"`, `"bps"`).
 * Statically scaled quantities belong on the type instead (`fixedPointTypeNode`); for a contextual unit without scaling, use `unitNumberDisplayNode`.
 * When both are present, a resolved display value wins for presentation; the type's static `unit` is the fallback whenever injection cannot resolve.
 */
export function amountNumberDisplayNode<
    const TDecimals extends InjectableIntegerValueNode,
    const TUnit extends InjectableStringValueNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: AmountNumberDisplayNodeInput<TDecimals, TUnit, TPlugins>,
): AmountNumberDisplayNode<TDecimals, TUnit, TPlugins> {
    return Object.freeze({
        kind: 'amountNumberDisplayNode',

        // Children.
        decimals: input.decimals,
        ...(input.unit !== undefined && { unit: input.unit }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}

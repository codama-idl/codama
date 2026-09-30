import type { InjectableStringValueNode, PluginNode, UnitNumberDisplayNode } from '@codama/node-types';

export type UnitNumberDisplayNodeInput<
    TUnit extends InjectableStringValueNode = InjectableStringValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<UnitNumberDisplayNode<TUnit, TPlugins>, 'kind'>;

/**
 * Display metadata that labels a number with a contextually resolved unit, without any scaling.
 * The one presentation form valid on numbers whose scale is already fixed — floats (which self-scale) and `fixedPointTypeNode`s (whose `scale` is static) — and equally usable on plain integers.
 * When the type also carries a static `unit`, a resolved display unit wins for presentation; the type's unit is the fallback whenever injection cannot resolve.
 */
export function unitNumberDisplayNode<
    const TUnit extends InjectableStringValueNode,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: UnitNumberDisplayNodeInput<TUnit, TPlugins>): UnitNumberDisplayNode<TUnit, TPlugins> {
    return Object.freeze({
        kind: 'unitNumberDisplayNode',

        // Children.
        unit: input.unit,
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}

import type { PluginNode } from '../PluginNode';
import type { InjectableStringValueNode } from '../valueNodes/InjectableStringValueNode';

/**
 * Display metadata that labels a number with a contextually resolved unit, without any scaling.
 * The one presentation form valid on numbers whose scale is already fixed — floats (which self-scale) and `fixedPointTypeNode`s (whose `scale` is static) — and equally usable on plain integers.
 * When the type also carries a static `unit`, a resolved display unit wins for presentation; the type's unit is the fallback whenever injection cannot resolve.
 */
export interface UnitNumberDisplayNode<
    TUnit extends InjectableStringValueNode = InjectableStringValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'unitNumberDisplayNode';

    // Children.
    /**
     * A label appended after the value (e.g. `"SOL"`, `"USDC"`, `"%"`). Resolved as a string value: either a literal `stringValueNode` or a key resolved from a surrounding provider.
     * When this input cannot resolve, renderers should present the value without a unit.
     */
    readonly unit: TUnit;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

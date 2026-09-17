import type { PluginNode } from '../PluginNode';
import type { TransformNode } from '../transformNodes/TransformNode';
import type { IntegerTypeNode } from './IntegerTypeNode';

/**
 * An elapsed duration encoded as an integer count of ticks.
 * Renderers typically format the value as `HH:mm:ss` or a coarser human-readable form.
 */
export interface DurationTypeNode<
    TNumber extends IntegerTypeNode = IntegerTypeNode,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'durationTypeNode';

    // Data.
    /**
     * How many ticks make one second. Defaults to `1` (the value is already in seconds).
     * Common choices are `1000` (milliseconds), `1000000` (microseconds), and `1000000000` (nanoseconds).
     */
    readonly ticksPerSecond?: number;

    // Children.
    /**
     * The integer type used to serialise the tick count — a pure encoding slot.
     * It must not carry a `unit` or `display` of its own.
     */
    readonly number: TNumber;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

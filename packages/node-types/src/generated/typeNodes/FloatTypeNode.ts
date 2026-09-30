import type { UnitNumberDisplayNode } from '../displayNodes/UnitNumberDisplayNode';
import type { PluginNode } from '../PluginNode';
import type { Endianness } from '../shared/endianness';
import type { FloatFormat } from '../shared/floatFormat';
import type { TransformNode } from '../transformNodes/TransformNode';

/**
 * An IEEE-754 floating-point number with a fixed wire format and byte order.
 * Floating-point numbers are notoriously unsafe for financial values — prefer `fixedPointTypeNode` for those.
 */
export interface FloatTypeNode<
    TFormat extends FloatFormat = FloatFormat,
    TDisplay extends UnitNumberDisplayNode | undefined = UnitNumberDisplayNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'floatTypeNode';

    // Data.
    /** The wire format used to serialise the float. */
    readonly format: TFormat;
    /** The byte order used to serialise the float. Defaults to `le`. */
    readonly endian?: Endianness;
    /**
     * The unit of measure the float denotes — e.g. `"USD"`.
     * Part of the value semantics: without it, consumers cannot know what quantity the number represents.
     */
    readonly unit?: string;

    // Children.
    /**
     * Display metadata describing how the float is presented.
     * Only a contextual unit applies: a float already carries its own scale.
     */
    readonly display?: TDisplay;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

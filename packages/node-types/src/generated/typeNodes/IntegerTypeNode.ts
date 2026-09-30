import type { NumberDisplayNode } from '../displayNodes/NumberDisplayNode';
import type { PluginNode } from '../PluginNode';
import type { Endianness } from '../shared/endianness';
import type { IntegerFormat } from '../shared/integerFormat';
import type { TransformNode } from '../transformNodes/TransformNode';

/** An integer with a fixed wire format and byte order. */
export interface IntegerTypeNode<
    TFormat extends IntegerFormat = IntegerFormat,
    TDisplay extends NumberDisplayNode | undefined = NumberDisplayNode | undefined,
    TTransforms extends Array<TransformNode> | undefined = Array<TransformNode> | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'integerTypeNode';

    // Data.
    /** The wire format used to serialise the integer. */
    readonly format: TFormat;
    /** The byte order used to serialise the integer. Defaults to `le`; byte-oriented formats such as `shortU16` ignore it. */
    readonly endian?: Endianness;
    /**
     * The unit of measure the integer denotes — e.g. `"slots"` or `"bps"`.
     * Part of the value semantics: without it, consumers cannot know what quantity the number represents. For scaled quantities, use `fixedPointTypeNode` instead.
     */
    readonly unit?: string;

    // Children.
    /** Display metadata describing how the integer is presented. */
    readonly display?: TDisplay;
    /** Transforms applied to the serialisation of this type, in order — the first is the innermost. */
    readonly transforms?: TTransforms;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

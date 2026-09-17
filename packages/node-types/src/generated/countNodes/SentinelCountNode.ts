import type { PluginNode } from '../PluginNode';
import type { SentinelCountStrategy } from '../shared/sentinelCountStrategy';
import type { ConstantValueNode } from '../valueNodes/ConstantValueNode';

/**
 * A count strategy where items are read until the bytes at the next item position match a constant sentinel.
 * Unlike `sentinelTransformNode`, the sentinel is only compared at item boundaries and never searched for within the encoded bytes, so it may legitimately occur inside an item.
 *
 * At each item boundary, decoding proceeds in order:
 *
 * 1. If fewer bytes than the sentinel remain, decoding fails under the `required` strategy and stops otherwise.
 * 2. If the next bytes match the sentinel, they are consumed and decoding stops.
 * 3. Otherwise, one item is decoded and the process repeats.
 *
 * The `strategy` attribute controls whether the sentinel is written when encoding and required when decoding. `required` writes it and demands it. `optional` writes it but tolerates buffers that end without it, such as tightly sized or legacy data. `omitted` never writes it and is therefore only meaningful when the collection is followed by unused space or the end of the buffer, since nothing else marks where it ends.
 *
 * In every strategy, a sentinel that is present is consumed. Should a following attribute need to read those bytes as well, wrap it in a `preOffsetTransformNode` that steps back by the size of the sentinel.
 *
 * > [!IMPORTANT]
 * > No item may begin with the sentinel's bytes, or decoding would stop at that item. With the `optional` and `omitted` strategies, the sentinel must also be no wider than the smallest possible item, so that a tail shorter than the sentinel can never hold a valid item.
 */
export interface SentinelCountNode<
    TSentinel extends ConstantValueNode = ConstantValueNode,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> {
    readonly kind: 'sentinelCountNode';

    // Data.
    /**
     * Whether the sentinel is written when encoding and required when decoding.
     * When absent, `required` is assumed.
     */
    readonly strategy?: SentinelCountStrategy;

    // Children.
    /** The fixed-size constant compared against the bytes at each item position. */
    readonly sentinel: TSentinel;
    /**
     * Namespaced plugins with custom structured data.
     * The universal extension point for renderer-specific or not-yet-standardised metadata.
     */
    readonly plugins?: TPlugins;
}

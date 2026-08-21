import type { PostOffsetStrategy } from '../shared/postOffsetStrategy';
import type { TypeNode } from './TypeNode';

/**
 * After serialising the wrapped type, advance the cursor by `offset` bytes interpreted via the chosen strategy.
 *
 * Since the offset is applied _after_ the wrapped type runs, this node is useful to move the cursor around once the wrapped type has been processed. See `preOffsetTypeNode` for the opposite behaviour.
 *
 * The strategies below are illustrated against the following buffer: the `99` byte represents the encoded value of the wrapped type and the `FF` byte represents the next bytes to be encoded after it, in order to show the _post_ cursor position.
 *
 * ```
 * 0x00000099FF000000;
 *         | └-- Initial post-offset
 *         └-- Pre-offset
 * ```
 *
 * **`relative`** — the cursor is moved to the right by the provided offset. A negative offset moves it to the left instead.
 *
 * ```
 * offset = 2
 * 0x000000990000FF00;
 *               └-- Post-offset
 *
 * offset = -2
 * 0x0000FF9900000000;
 *       └-- Post-offset
 * ```
 *
 * **`absolute`** — the cursor is moved to an absolute position in the buffer. A negative offset moves it backwards from the end of the buffer.
 *
 * ```
 * offset = 0
 * 0xFF00009900000000;
 *   └-- Post-offset
 *
 * offset = -2
 * 0x000000990000FF00;
 *               └-- Post-offset
 * ```
 *
 * **`padded`** — the cursor is moved to the right by the provided offset **and the buffer size is increased** by the offset amount, allowing padding bytes to be added. Reciprocally, a negative offset moves the cursor to the left and decreases the buffer size.
 *
 * ```
 * offset = 2
 * 0x000000990000FF000000; <- Size = 10 (initially 8)
 *               └-- Post-offset
 *
 * offset = -2
 * 0x0000FF990000; <- Size = 6 (initially 8)
 *       └-- Post-offset
 * ```
 *
 * **`preOffset`** — the cursor is moved to the right of the pre-offset — i.e. where the wrapped type started — by the provided offset. A negative offset moves it to the left of the pre-offset instead.
 *
 * ```
 * offset = 2
 * 0x0000009900FF0000;
 *         |   └-- Post-offset = Pre-offset + 2
 *         └-- Pre-offset
 *
 * offset = -2
 * 0x00FF009900000000;
 *     |   └-- Pre-offset
 *     └-- Post-offset = Pre-offset - 2
 * ```
 *
 * > [!IMPORTANT]
 * > Some type nodes affect the buffer that is available to us: depending on where we are in the type tree, we may not have access to the entire buffer.
 * > For instance, inside a `fixedSizeTypeNode`, the buffer is truncated or padded to match the provided fixed size once the wrapped content has been serialised — we are essentially "boxed" into a sub-buffer, and that sub-buffer is the one affected by the `absolute` strategy.
 * > The type nodes that create sub-buffers are: `fixedSizeTypeNode`, `sentinelTypeNode`, and `sizePrefixTypeNode`.
 */
export interface PostOffsetTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'postOffsetTypeNode';

    // Data.
    /** The signed byte offset to apply after the wrapped type runs. */
    readonly offset: number;
    /** How the `offset` value is interpreted. */
    readonly strategy: PostOffsetStrategy;

    // Children.
    /** The wrapped type whose serialisation is followed by the offset. */
    readonly type: TType;
}

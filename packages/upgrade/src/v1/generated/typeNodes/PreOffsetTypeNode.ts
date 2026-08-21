import type { PreOffsetStrategy } from '../shared/preOffsetStrategy';
import type { TypeNode } from './TypeNode';

/**
 * Before serialising the wrapped type, advance the cursor by `offset` bytes interpreted via the chosen strategy.
 *
 * Since the offset is applied _before_ the wrapped type runs, this node is useful to move the encoded value of the wrapped type itself. See `postOffsetTypeNode` for the opposite behaviour.
 *
 * The strategies below are illustrated against the following buffer: the `99` byte represents some previously encoded value for reference and the `FF` byte represents the encoded value of the wrapped type, which moves as its pre-offset changes.
 *
 * ```
 * 0x00000099FF000000;
 *           └-- Initial pre-offset
 * ```
 *
 * **`relative`** — the cursor is moved to the right by the provided offset. A negative offset moves it to the left instead.
 *
 * ```
 * offset = 2
 * 0x000000990000FF00;
 *               └-- Pre-offset
 *
 * offset = -2
 * 0x0000FF9900000000;
 *       └-- Pre-offset
 * ```
 *
 * **`absolute`** — the cursor is moved to an absolute position in the buffer. A negative offset moves it backwards from the end of the buffer.
 *
 * ```
 * offset = 0
 * 0xFF00009900000000;
 *   └-- Pre-offset
 *
 * offset = -2
 * 0x000000990000FF00;
 *               └-- Pre-offset
 * ```
 *
 * **`padded`** — the cursor is moved to the right by the provided offset **and the buffer size is increased** by the offset amount, allowing padding bytes to be added. Reciprocally, a negative offset moves the cursor to the left and decreases the buffer size.
 *
 * ```
 * offset = 2
 * 0x000000990000FF000000; <- Size = 10 (initially 8)
 *               └-- Pre-offset
 *
 * offset = -2
 * 0x0000FF990000; <- Size = 6 (initially 8)
 *       └-- Pre-offset
 * ```
 *
 * > [!IMPORTANT]
 * > Some type nodes affect the buffer that is available to us: depending on where we are in the type tree, we may not have access to the entire buffer.
 * > For instance, inside a `fixedSizeTypeNode`, the buffer is truncated or padded to match the provided fixed size once the wrapped content has been serialised — we are essentially "boxed" into a sub-buffer, and that sub-buffer is the one affected by the `absolute` strategy.
 * > The type nodes that create sub-buffers are: `fixedSizeTypeNode`, `sentinelTypeNode`, and `sizePrefixTypeNode`.
 */
export interface PreOffsetTypeNode<TType extends TypeNode = TypeNode> {
    readonly kind: 'preOffsetTypeNode';

    // Data.
    /** The signed byte offset to apply before the wrapped type runs. */
    readonly offset: number;
    /** How the `offset` value is interpreted. */
    readonly strategy: PreOffsetStrategy;

    // Children.
    /** The wrapped type whose serialisation is preceded by the offset. */
    readonly type: TType;
}

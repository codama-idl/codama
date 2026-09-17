import type { PluginNode, PostOffsetStrategy, PostOffsetTransformNode } from '@codama/node-types';

/**
 * After serialising the transformed type, advance the cursor by `offset` bytes interpreted via the chosen strategy.
 *
 * Since the offset is applied _after_ the transformed type runs, this transform is useful to move the cursor around once the transformed type has been processed. See `preOffsetTransformNode` for the opposite behaviour.
 *
 * The strategies below are illustrated against the following buffer: the `99` byte represents the encoded value of the transformed type and the `FF` byte represents the next bytes to be encoded after it, in order to show the _post_ cursor position.
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
 * **`preOffset`** — the cursor is moved to the right of the pre-offset — i.e. where the transformed type started — by the provided offset. A negative offset moves it to the left of the pre-offset instead.
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
 * > Some transforms affect the buffer that is available to us: depending on where we are in the type tree, we may not have access to the entire buffer.
 * > For instance, under a `fixedSizeTransformNode`, the buffer is truncated or padded to match the provided fixed size once the transformed content has been serialised — we are essentially "boxed" into a sub-buffer, and that sub-buffer is the one affected by the `absolute` strategy.
 * > The transforms that create sub-buffers are: `fixedSizeTransformNode`, `sentinelTransformNode`, and `sizePrefixTransformNode`.
 */
export function postOffsetTransformNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    offset: number,
    options: {
        strategy?: PostOffsetStrategy;
        plugins?: TPlugins;
    } = {},
): PostOffsetTransformNode<TPlugins> {
    return Object.freeze({
        kind: 'postOffsetTransformNode',

        // Data.
        offset,
        strategy: options.strategy ?? 'relative',

        // Children.
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}

# `PreOffsetTypeNode`

A node that wraps another type node and offsets the encoding/decoding cursor by a provided amount using a [provided strategy](#offset-strategies).

Since this is the `PreOffsetTypeNode`, the offset is applied _before_ the child node has been encoded/decoded. Therefore, this node is useful to move encoded value of the child node itself. See the [`PostOffsetTypeNode`](./PostOffsetTypeNode.md) for the opposite behavior.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute  | Type                                   | Description                                       |
| ---------- | -------------------------------------- | ------------------------------------------------- |
| `kind`     | `"preOffsetTypeNode"`                  | The node discriminator.                           |
| `offset`   | `number`                               | The offset amount in bytes.                       |
| `strategy` | `"absolute" \| "padded" \| "relative"` | The offset strategy (see below for more details). |

### Children

| Attribute | Type                      | Description               |
| --------- | ------------------------- | ------------------------- |
| `type`    | [`TypeNode`](./README.md) | The child node to offset. |

## Offset strategies

In order to illustrate the behavior of each strategy, we will use the following buffer as an example. The `99` bytes represent some previously encoded value for reference and the `FF` bytes represent the child node's encoded value which we will be moving by changing its pre-offset.

```
0x00000099FF000000;
          └-- Initial pre-offset
```

The following offset strategies are available.

### `relative`

The cursor is moved to the right by the provided offset.

```
offset = 2
0x000000990000FF00;
              └-- Pre-offset
```

When a negative offset is provided, the cursor is moved the left instead.

```
offset = -2
0x0000FF9900000000;
      └-- Pre-offset
```

### `absolute`

The cursor is moved to an absolute position in the buffer.

```
offset = 0
0xFF00009900000000;
  └-- Pre-offset
```

When a negative offset is provided, the cursor is moved backwards from the end of the buffer.

```
offset = -2
0x000000990000FF00;
              └-- Pre-offset
```

> [!IMPORTANT]  
> Please note that some `TypeNodes` affect the buffer that is available to us which means, depending on where we are in the `TypeNode` tree, we may not have access to the entire buffer.
>
> For instance, say you are inside a `FixedSizeTypeNode`. Once the content of the `FixedSizeTypeNode` has been encoded/decoded, the buffer will be truncated or padded to match the provided fixed size. This means, when inside that node, we are essentially "boxed" in a sub-buffer. This sub-buffer is the one that will be affected by the `absolute` offset.
>
> Here is an exhaustive list of all `TypeNodes` that create sub-buffers:
>
> - [`FixedSizeTypeNode`](./FixedSizeTypeNode.md)
> - [`SentinelTypeNode`](./SentinelTypeNode.md)
> - [`SizePrefixTypeNode`](./SizePrefixTypeNode.md)

### `padded`

The cursor is moved to the right by the provided offset **and the buffer size is increased** by the offset amount. This allows us to add padding bytes to the buffer.

```
offset = 2
0x000000990000FF000000; <- Size = 10 (initially 8)
              └-- Pre-offset
```

Reciprocally, when a negative offset is provided, the cursor is moved the left and the buffer size is decreased.

```
offset = -2
0x0000FF990000; <- Size = 6 (initially 8)
      └-- Pre-offset
```

## Functions

### `preOffsetTypeNode(type, offset, strategy?)`

Helper function that creates a `PreOffsetTypeNode` object from a child `TypeNode`, an offset and — optionally — a strategy which defaults to `"relative"`.

```ts
const relativeOffsetNode = preOffsetTypeNode(numberTypeNode('u32'), 2);
const absoluteOffsetNode = preOffsetTypeNode(numberTypeNode('u32'), -2, 'absolute');
```

## Examples

### A left-padded u32 number

```ts
preOffsetTypeNode(numberTypeNode('u32'), 4, 'padded');

// 42 => 0x000000002A000000
```

### A u32 number overwritten by a u16 number

```ts
tupleTypleNode([numberTypeNode('u32'), preOffsetTypeNode(numberTypeNode('u16'), -2)]);

// [1, 2]           => 0x01000200
// [0xFFFFFFFF, 42] => 0xFFFF2A00
```

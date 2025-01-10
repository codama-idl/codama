# `PostOffsetTypeNode`

A node that wraps another type node and offsets the encoding/decoding cursor by a provided amount using a [provided strategy](#offset-strategies).

Since this is the `PostOffsetTypeNode`, the offset is applied _after_ the child node has been encoded/decoded. Therefore, this node is useful to move the cursor around after the child node has been processed. See the [`PreOffsetTypeNode`](./PreOffsetTypeNode.md) for the opposite behavior.

This node can be used to create [`NestedTypeNodes`](./NestedTypeNode.md).

## Attributes

### Data

| Attribute  | Type                                                  | Description                                       |
| ---------- | ----------------------------------------------------- | ------------------------------------------------- |
| `kind`     | `"postOffsetTypeNode"`                                | The node discriminator.                           |
| `offset`   | `number`                                              | The offset amount in bytes.                       |
| `strategy` | `"absolute" \| "padded" \| "preOffset" \| "relative"` | The offset strategy (see below for more details). |

### Children

| Attribute | Type                      | Description               |
| --------- | ------------------------- | ------------------------- |
| `type`    | [`TypeNode`](./README.md) | The child node to offset. |

## Offset strategies

In order to illustrate the behavior of each strategy, we will use the following buffer as an example. The `99` bytes represent the child node's encoded value and the `FF` bytes represent the next bytes to be encoded (after the child node) in order to illustrate the _post_ cursor position.

```
0x00000099FF000000;
        | └-- Initial post-offset
        └-- Pre-offset
```

The following offset strategies are available.

### `relative`

The cursor is moved to the right by the provided offset.

```
offset = 2
0x000000990000FF00;
              └-- Post-offset
```

When a negative offset is provided, the cursor is moved the left instead.

```
offset = -2
0x0000FF9900000000;
      └-- Post-offset
```

### `absolute`

The cursor is moved to an absolute position in the buffer.

```
offset = 0
0xFF00009900000000;
  └-- Post-offset
```

When a negative offset is provided, the cursor is moved backwards from the end of the buffer.

```
offset = -2
0x000000990000FF00;
              └-- Post-offset
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
              └-- Post-offset
```

Reciprocally, when a negative offset is provided, the cursor is moved the left and the buffer size is decreased.

```
offset = -2
0x0000FF990000; <- Size = 6 (initially 8)
      └-- Post-offset
```

### `preOffset`

The cursor is moved **to the right of the pre-offset** by the provided offset.

```
offset = 2
0x0000009900FF0000;
        |   └-- Post-offset = Pre-offset + 2
        └-- Pre-offset
```

When a negative offset is provided, the cursor is moved the left of the pre-offset instead.

```
offset = -2
0x00FF009900000000;
    |   └-- Pre-offset
    └-- Post-offset = Pre-offset - 2
```

## Functions

### `postOffsetTypeNode(type, offset, strategy?)`

Helper function that creates a `PostOffsetTypeNode` object from a child `TypeNode`, an offset and — optionally — a strategy which defaults to `"relative"`.

```ts
const relativeOffsetNode = postOffsetTypeNode(numberTypeNode('u32'), 2);
const absoluteOffsetNode = postOffsetTypeNode(numberTypeNode('u32'), -2, 'absolute');
```

## Examples

### A right-padded u32 number

```ts
postOffsetTypeNode(numberTypeNode('u32'), 4, 'padded');

// 42 => 0x2A00000000000000
```

### A u32 number overwritten by a u16 number

```ts
tupleTypleNode([postOffsetTypeNode(numberTypeNode('u32'), -2), numberTypeNode('u16')]);

// [1, 2]           => 0x01000200
// [0xFFFFFFFF, 42] => 0xFFFF2A00
```

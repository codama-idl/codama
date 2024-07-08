# `RemainderCountNode`

A node that represents a count strategy where **the number of items is unknown and inferred by the remainder of the bytes**. When encoding, the items are encoded as-is without storing the total count. When decoding, items are decoded one by one until the end of the buffer is reached.

This enables nodes such as [`ArrayTypeNode`](../typeNodes/ArrayTypeNode.md) to represent variable arrays at the end of buffers.

## Attributes

### Data

| Attribute | Type                   | Description             |
| --------- | ---------------------- | ----------------------- |
| `kind`    | `"remainderCountNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `remainderCountNode()`

Helper function that creates a `RemainderCountNode` object.

```ts
const node = remainderCountNode();
```

## Examples

### A remainder array of public keys

```ts
arrayTypeNode(publicKeyTypeNode(), remainderCountNode());
```

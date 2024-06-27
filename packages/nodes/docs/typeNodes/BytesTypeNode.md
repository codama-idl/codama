# `BytesTypeNode`

A node that represents data as raw bytes. This can be useful for representing data that doesn't have a specific type or structure. It can also be shaped in size using nodes such as the [`SizePrefixTypeNode`](./SizePrefixTypeNode.md) or the [`FixedSizeTypeNode`](./FixedSizeTypeNode.md).

## Attributes

### Data

| Attribute | Type              | Description             |
| --------- | ----------------- | ----------------------- |
| `kind`    | `"bytesTypeNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `bytesTypeNode()`

Helper function that creates a `BytesTypeNode` object.

```ts
const node = bytesTypeNode();
```

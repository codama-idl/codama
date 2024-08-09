# `StringTypeNode`

A node that represents an unbounded string from a given encoding. It can be shaped in size using nodes such as the [`SizePrefixTypeNode`](./SizePrefixTypeNode.md) or the [`FixedSizeTypeNode`](./FixedSizeTypeNode.md).

## Attributes

### Data

| Attribute  | Type                                         | Description                 |
| ---------- | -------------------------------------------- | --------------------------- |
| `kind`     | `"stringTypeNode"`                           | The node discriminator.     |
| `encoding` | `"base16" \| "base58" \| "base64" \| "utf8"` | The encoding of the string. |

### Children

_This node has no children._

## Functions

### `stringTypeNode(encoding)`

Helper function that creates a `StringTypeNode` object from an encoding.

```ts
const node = stringTypeNode('utf8');
```

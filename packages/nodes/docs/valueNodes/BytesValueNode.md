# `BytesValueNode`

A node that represents a value in bytes — e.g. `0x010203`.

## Attributes

### Data

| Attribute  | Type                                         | Description                           |
| ---------- | -------------------------------------------- | ------------------------------------- |
| `kind`     | `"bytesValueNode"`                           | The node discriminator.               |
| `encoding` | `"base16" \| "base58" \| "base64" \| "utf8"` | The encoding of the `data` attribute. |
| `data`     | `string`                                     | The encoded data.                     |

### Children

_This node has no children._

## Functions

### `bytesValueNode(encoding, data)`

Helper function that creates a `BytesValueNode` object from an encoding and an encoded data string.

```ts
const node = bytesValueNode('base16', '010203');
const utf8Node = bytesValueNode('utf8', 'Hello');
```

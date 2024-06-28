# `PublicKeyTypeNode`

A node that represents a 32-byte public key.

## Attributes

### Data

| Attribute | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| `kind`    | `"publicKeyTypeNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `publicKeyTypeNode()`

Helper function that creates a `PublicKeyTypeNode` object.

```ts
const node = publicKeyTypeNode();
```

# `RemainderOptionTypeNode`

A node that represents an optional item using a child `TypeNode`. The item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer. If there are remaining bytes, the item is present and the child node should be encoded/decoded accordingly. However, if there are no remaining bytes, the item is absent and no further encoding/decoding should be performed.

## Attributes

### Data

| Attribute | Type                        | Description             |
| --------- | --------------------------- | ----------------------- |
| `kind`    | `"remainderOptionTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                      | Description              |
| --------- | ------------------------- | ------------------------ |
| `item`    | [`TypeNode`](./README.md) | The item that may exist. |

## Functions

### `remainderOptionTypeNode(item)`

Helper function that creates a `RemainderOptionTypeNode` object from the item `TypeNode`.

```ts
const node = remainderOptionTypeNode(publicKeyTypeNode());
```

## Examples

### An optional UTF-8 string using remaining bytes

```ts
remainderOptionTypeNode(stringTypeNode('UTF-8'));

// None          => 0x
// Some("Hello") => 0x48656C6C6F
```

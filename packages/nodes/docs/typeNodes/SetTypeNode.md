# `SetTypeNode`

A node that represents a set of unique items. The type of each item is defined by the `item` child node and the length of the set is determined by the `count` child node.

## Attributes

### Data

| Attribute | Type            | Description             |
| --------- | --------------- | ----------------------- |
| `kind`    | `"setTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                   | Description                                    |
| --------- | -------------------------------------- | ---------------------------------------------- |
| `item`    | [`TypeNode`](./README.md)              | The type of each item in the set.              |
| `count`   | [`CountNode`](../countNodes/README.md) | The strategy to determine the size of the set. |

## Functions

### `setTypeNode(item, count)`

Helper function that creates a `SetTypeNode` object from a `TypeNode` and a `CountNode`.

```ts
const node = setTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode('u32')));
```

## Examples

### u32 prefixed array of u8 numbers

```ts
setTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32')));

// Set (1, 2, 3) => 0x03000000010203
```

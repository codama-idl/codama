# `ArrayTypeNode`

A node that represents an array of items. The type of the items is defined by the `item` child node and the length of the array is determined by the `count` child node.

## Attributes

### Data

| Attribute | Type              | Description             |
| --------- | ----------------- | ----------------------- |
| `kind`    | `"arrayTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                         | Description                                 |
| --------- | ---------------------------- | ------------------------------------------- |
| `item`    | [`TypeNode`](../typeNodes)   | The item type of the array.                 |
| `count`   | [`CountNode`](../countNodes) | The strategy to determine the array length. |

## Functions

### `arrayTypeNode(item, count)`

Helper function that creates a `ArrayTypeNode` object from a `TypeNode` and a `CountNode`.

```ts
const node = arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode('u32')));
```

## Examples

### u32 prefixed array of u8 numbers

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/1bbd3ecb-e06a-42fa-94a7-74c9302286e6)

```ts
arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32')));

// [1, 2, 3] => 0x03000000010203
```

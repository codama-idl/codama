# `FixedCountNode`

A node that represents a count strategy where **the number of items is known and fixed**. This enables nodes such as [`ArrayTypeNode`](../typeNodes/ArrayTypeNode.md) to represent arrays of a fixed length.

## Attributes

### Data

| Attribute | Type               | Description               |
| --------- | ------------------ | ------------------------- |
| `kind`    | `"fixedCountNode"` | The node discriminator.   |
| `value`   | `number`           | The fixed count of items. |

### Children

_This node has no children._

## Functions

### `fixedCountNode(value)`

Helper function that creates a `FixedCountNode` object from a number.

```ts
const node = fixedCountNode(42);
```

## Examples

### An array of three public keys

```ts
arrayTypeNode(publicKeyTypeNode(), fixedCountNode(3));
```

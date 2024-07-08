# `PrefixedCountNode`

A node that represents a count strategy where **the number of items is stored as a number prefix**. This enables nodes such as [`ArrayTypeNode`](../typeNodes/ArrayTypeNode.md) to represent arrays such that their length is stored as a prefix.

## Attributes

### Data

| Attribute | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| `kind`    | `"prefixedCountNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                                                   | Description                                   |
| --------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `prefix`  | [`NestedTypeNode`](../typeNodes/NestedTypeNode.md)<[`NumberTypeNode`](../typeNodes/NumberTypeNode.md)> | The node that determines the number of items. |

## Functions

### `prefixedCountNode(prefix)`

Helper function that creates a `PrefixedCountNode` object from a number node.

```ts
const node = prefixedCountNode(numberTypeNode(u32));
```

## Examples

### An variable array of public keys prefixed with a u32

```ts
arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode(u32)));
```

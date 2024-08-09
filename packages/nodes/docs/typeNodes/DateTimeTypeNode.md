# `DateTimeTypeNode`

A node that wraps a [`NumberTypeNode`](./NumberTypeNode.md) to make it a datetime such that the number represents the number of seconds since the Unix epoch.

## Attributes

### Data

| Attribute | Type                 | Description             |
| --------- | -------------------- | ----------------------- |
| `kind`    | `"dateTimeTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                             | Description              |
| --------- | -------------------------------------------------------------------------------- | ------------------------ |
| `number`  | [`NestedTypeNode`](./NestedTypeNode.md)<[`NumberTypeNode`](./NumberTypeNode.md)> | The number node to wrap. |

## Functions

### `dateTimeTypeNode(number)`

Helper function that creates a `DateTimeTypeNode` object from a `NumberTypeNode`.

```ts
const node = dateTimeTypeNode(numberTypeNode('u64'));
```

## Examples

### u64 unix datetime

```ts
dateTimeTypeNode(numberTypeNode('u64'));

// 2024-06-27T14:57:56Z => 0x667D7DF400000000
```

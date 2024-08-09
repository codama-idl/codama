# `MapEntryValueNode`

A node that represents the concrete value of a map entry. For example, the map `{ total: 42 }` has only one entry such that its key is a `"total"` string and its value is a `42` number.

## Attributes

### Data

| Attribute | Type                  | Description             |
| --------- | --------------------- | ----------------------- |
| `kind`    | `"mapEntryValueNode"` | The node discriminator. |

### Children

| Attribute | Type                       | Description             |
| --------- | -------------------------- | ----------------------- |
| `key`     | [`ValueNode`](./README.md) | The key of the entry.   |
| `value`   | [`ValueNode`](./README.md) | The value of the entry. |

## Functions

### `mapEntryValueNode(key, value)`

Helper function that creates a `MapEntryValueNode` object from two `ValueNode` objects. The first one represents the key of the entry, and the second one represents the value of the entry.

```ts
const node = mapEntryValueNode(stringValueNode('total'), numberValueNode(42));
```

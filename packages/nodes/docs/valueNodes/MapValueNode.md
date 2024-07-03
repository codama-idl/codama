# `MapValueNode`

A node that represents the value of a map.

## Attributes

### Data

| Attribute | Type             | Description             |
| --------- | ---------------- | ----------------------- |
| `kind`    | `"mapValueNode"` | The node discriminator. |

### Children

| Attribute | Type                                            | Description                          |
| --------- | ----------------------------------------------- | ------------------------------------ |
| `entries` | [`MapEntryValueNode`](./MapEntryValueNode.md)[] | The value of all entries in the map. |

## Functions

### `mapValueNode(entries)`

Helper function that creates a `MapValueNode` object from an array of `MapEntryValueNode` objects. Each object represents a key-value pair in the map.

```ts
const node = mapValueNode([
    mapEntryValueNode(stringValueNode('apples'), numberValueNode(12)),
    mapEntryValueNode(stringValueNode('bananas'), numberValueNode(34)),
    mapEntryValueNode(stringValueNode('carrots'), numberValueNode(56)),
]);
```

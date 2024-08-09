# `SetValueNode`

A node that represents a set of values — e.g. `{1, 2, 3}`.

## Attributes

### Data

| Attribute | Type             | Description             |
| --------- | ---------------- | ----------------------- |
| `kind`    | `"setValueNode"` | The node discriminator. |

### Children

| Attribute | Type                         | Description                        |
| --------- | ---------------------------- | ---------------------------------- |
| `items`   | [`ValueNode`](./README.md)[] | The value of all items in the set. |

## Functions

### `setValueNode(items)`

Helper function that creates a `SetValueNode` object from an array of value nodes.

```ts
const node = setValueNode([numberValueNode(1), numberValueNode(2), numberValueNode(3)]);
```

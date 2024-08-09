# `ArrayValueNode`

A node that represents an array of values — e.g. `[1, 2, 3]`.

## Attributes

### Data

| Attribute | Type               | Description             |
| --------- | ------------------ | ----------------------- |
| `kind`    | `"arrayValueNode"` | The node discriminator. |

### Children

| Attribute | Type                         | Description                      |
| --------- | ---------------------------- | -------------------------------- |
| `items`   | [`ValueNode`](./README.md)[] | The value of all items in array. |

## Functions

### `arrayValueNode(items)`

Helper function that creates a `ArrayValueNode` object from an array of value nodes.

```ts
const node = arrayValueNode([numberValueNode(1), numberValueNode(2), numberValueNode(3)]);
```

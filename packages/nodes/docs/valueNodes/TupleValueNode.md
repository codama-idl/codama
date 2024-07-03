# `TupleValueNode`

A node that represents the value of a tuple — e.g. `("Alice", 42)`.

## Attributes

### Data

| Attribute | Type               | Description             |
| --------- | ------------------ | ----------------------- |
| `kind`    | `"tupleValueNode"` | The node discriminator. |

### Children

| Attribute | Type                         | Description                          |
| --------- | ---------------------------- | ------------------------------------ |
| `items`   | [`ValueNode`](./README.md)[] | The value of all items in the tuple. |

## Functions

### `tupleValueNode(items)`

Helper function that creates a `TupleValueNode` object from an array of value nodes.

```ts
const node = tupleValueNode([stringValueNode('Alice'), numberValueNode(42)]);
```

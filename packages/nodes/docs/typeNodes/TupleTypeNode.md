# `TupleTypeNode`

A node that represents a tuple of types such that each element in the tuple is represented by a dedicated [`TypeNode`](./TypeNode.md). Each item is encoded and decoded in the order they are defined.

## Attributes

### Data

| Attribute | Type              | Description             |
| --------- | ----------------- | ----------------------- |
| `kind`    | `"tupleTypeNode"` | The node discriminator. |

### Children

| Attribute | Type                        | Description                         |
| --------- | --------------------------- | ----------------------------------- |
| `items`   | [`TypeNode`](./README.md)[] | The type of each item in the tuple. |

## Functions

### `tupleTypeNode(items)`

Helper function that creates a `TupleTypeNode` object from an array of `TypeNodes`.

```ts
const node = tupleTypeNode([publicKeyTypeNode(), numberTypeNode('u64')]);
```

## Examples

### A tuple storing a person's name and age

```ts
tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 10), numberTypeNode('u8')]);

// (Alice, 42) => 0x416C69636500000000002A
```

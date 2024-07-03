# `StructValueNode`

A node that represents the value of a struct.

## Attributes

### Data

| Attribute | Type                | Description             |
| --------- | ------------------- | ----------------------- |
| `kind`    | `"structValueNode"` | The node discriminator. |

### Children

| Attribute | Type                                                  | Description                            |
| --------- | ----------------------------------------------------- | -------------------------------------- |
| `fields`  | [`StructFieldValueNode`](./StructFieldValueNode.md)[] | The value of all fields in the struct. |

## Functions

### `structValueNode(fields)`

Helper function that creates a `StructValueNode` object from an array of field value nodes.

```ts
const node = structValueNode([
    structFieldValueNode('name', stringValueNode('Alice')),
    structFieldValueNode('age', numberValueNode(42)),
]);
```

# `StructFieldValueNode`

A node that represents a field value in a struct — e.g. `age: 42`.

## Attributes

### Data

| Attribute | Type                     | Description             |
| --------- | ------------------------ | ----------------------- |
| `kind`    | `"structFieldValueNode"` | The node discriminator. |
| `name`    | `CamelCaseString`        | The name of the field.  |

### Children

| Attribute | Type                       | Description             |
| --------- | -------------------------- | ----------------------- |
| `value`   | [`ValueNode`](./README.md) | The value of the field. |

## Functions

### `structFieldValueNode(name, value)`

Helper function that creates a `StructFieldValueNode` object from a field name and a value node.

```ts
const node = structFieldValueNode('age', numberValueNode(42));
```

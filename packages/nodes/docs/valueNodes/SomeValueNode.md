# `SomeValueNode`

A node that represents the presence of a value. For instance, this could be set as a default value for a field of type [`OptionTypeNode`](../typeNodes/OptionTypeNode.md).

## Attributes

### Data

| Attribute | Type              | Description             |
| --------- | ----------------- | ----------------------- |
| `kind`    | `"someValueNode"` | The node discriminator. |

### Children

| Attribute | Type                       | Description                          |
| --------- | -------------------------- | ------------------------------------ |
| `value`   | [`ValueNode`](./README.md) | The value that is marked as present. |

## Functions

### `someValueNode(value)`

Helper function that creates a `SomeValueNode` object from a value node

```ts
const node = someValueNode(numberValueNode(42));
```

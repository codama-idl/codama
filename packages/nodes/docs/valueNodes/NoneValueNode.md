# `NoneValueNode`

A node that represents the absence of a value. For instance, this could be set as a default value for a field of type [`OptionTypeNode`](../typeNodes/OptionTypeNode.md).

## Attributes

### Data

| Attribute | Type              | Description             |
| --------- | ----------------- | ----------------------- |
| `kind`    | `"noneValueNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `noneValueNode()`

Helper function that creates a `NoneValueNode` object.

```ts
const node = noneValueNode();
```

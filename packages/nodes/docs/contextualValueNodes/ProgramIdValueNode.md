# `ProgramIdValueNode`

A node that represents the public key of the current program. That is, the address of the `ProgramNode` from which this node descends.

## Attributes

### Data

| Attribute | Type                   | Description             |
| --------- | ---------------------- | ----------------------- |
| `kind`    | `"programIdValueNode"` | The node discriminator. |

### Children

_This node has no children._

## Functions

### `programIdValueNode()`

Helper function that creates a `ProgramIdValueNode` object.

```ts
const node = programIdValueNode();
```

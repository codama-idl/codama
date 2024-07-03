# `BooleanValueNode`

A node that represents a boolean value — e.g. `true`.

## Attributes

### Data

| Attribute | Type                 | Description             |
| --------- | -------------------- | ----------------------- |
| `kind`    | `"booleanValueNode"` | The node discriminator. |
| `boolean` | `boolean`            | The boolean value.      |

### Children

_This node has no children._

## Functions

### `booleanValueNode(items)`

Helper function that creates a `BooleanValueNode` object from a boolean.

```ts
const node = booleanValueNode(true);
```

# `NumberValueNode`

A node that represents a number value — e.g. `42`.

## Attributes

### Data

| Attribute | Type                | Description             |
| --------- | ------------------- | ----------------------- |
| `kind`    | `"numberValueNode"` | The node discriminator. |
| `number`  | `number`            | The number value.       |

### Children

_This node has no children._

## Functions

### `numberValueNode(number)`

Helper function that creates a `NumberValueNode` object from any `number`.

```ts
const node = numberValueNode(42);
```

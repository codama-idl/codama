# `StringValueNode`

A node that represents a string value — e.g. `"Hello"`.

## Attributes

### Data

| Attribute | Type                | Description             |
| --------- | ------------------- | ----------------------- |
| `kind`    | `"stringValueNode"` | The node discriminator. |
| `string`  | `string`            | The string value.       |

### Children

_This node has no children._

## Functions

### `stringValueNode(string)`

Helper function that creates a `StringValueNode` object from a string value.

```ts
const node = stringValueNode('Hello');
```

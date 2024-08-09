# `PdaSeedValueNode`

A node that represents the value of a variable PDA seed.

## Attributes

### Data

| Attribute | Type                 | Description                    |
| --------- | -------------------- | ------------------------------ |
| `kind`    | `"pdaSeedValueNode"` | The node discriminator.        |
| `name`    | `CamelCaseString`    | The name of the variable seed. |

### Children

| Attribute | Type                                                                                                                                   | Description                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `value`   | [`AccountValueNode`](./AccountValueNode.md) \| [`ArgumentValueNode`](./ArgumentValueNode.md) \| [`ValueNode`](../valueNodes/README.md) | The value of the variable PDA seed. This can be a simple `ValueNode` or a contextual value pointing to another account or argument. |

## Functions

### `pdaSeedValueNode(name, value)`

Helper function that creates a `PdaSeedValueNode` object from the name of the variable seed and its value.

```ts
const node = pdaSeedValueNode('mint', accountValueNode('mint'));
```

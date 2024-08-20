# `AccountLinkNode`

This node represents a reference to an existing [`AccountNode`](../AccountNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                | Description                                                             |
| --------- | ------------------- | ----------------------------------------------------------------------- |
| `kind`    | `"accountLinkNode"` | The node discriminator.                                                 |
| `name`    | `CamelCaseString`   | The name of the [`AccountNode`](../AccountNode.md) we are referring to. |

### Children

_This node has no children._

## Functions

### `accountLinkNode(name)`

Helper function that creates a `AccountLinkNode` object from the name of the `AccountNode` we are referring to.

```ts
const node = accountLinkNode('myAccount');
```

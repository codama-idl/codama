# `PdaLinkNode`

This node represents a reference to an existing [`PdaNode`](../PdaNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type              | Description                                                     |
| --------- | ----------------- | --------------------------------------------------------------- |
| `kind`    | `"pdaLinkNode"`   | The node discriminator.                                         |
| `name`    | `CamelCaseString` | The name of the [`PdaNode`](../PdaNode.md) we are referring to. |

### Children

_This node has no children._

## Functions

### `pdaLinkNode(name)`

Helper function that creates a `PdaLinkNode` object from the name of the `PdaNode` we are referring to.

```ts
const node = pdaLinkNode('myPda');
```

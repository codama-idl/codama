# `DefinedTypeLinkNode`

This node represents a reference to an existing [`DefinedTypeNode`](../DefinedTypeNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                    | Description                                                                     |
| --------- | ----------------------- | ------------------------------------------------------------------------------- |
| `kind`    | `"definedTypeLinkNode"` | The node discriminator.                                                         |
| `name`    | `CamelCaseString`       | The name of the [`DefinedTypeNode`](../DefinedTypeNode.md) we are referring to. |

### Children

_This node has no children._

## Functions

### `definedTypeLinkNode(name)`

Helper function that creates a `DefinedTypeLinkNode` object from the name of the `DefinedTypeNode` we are referring to.

```ts
const node = definedTypeLinkNode('myDefinedType');
```

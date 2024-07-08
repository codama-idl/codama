# `PdaLinkNode`

This node represents a reference to an existing [`PdaNode`](../PdaNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute    | Type              | Description                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `"pdaLinkNode"`   | The node discriminator.                                                                                                                                                                                                                                                                                                                                                                                                       |
| `name`       | `CamelCaseString` | The name of the [`PdaNode`](../PdaNode.md) we are referring to.                                                                                                                                                                                                                                                                                                                                                               |
| `importFrom` | `CamelCaseString` | (Optional) The reference of the module we are importing from or `"hooked"` if the PDA is defined in the same module but manually written when rendering clients. Default to referrencing directly from the Kinobi IDL instead of using an external referrence. Note that this information is only used for rendering clients. This, it will likely be removed from the Kinobi IDL and pushed to the renderer options instead. |

### Children

_This node has no children._

## Functions

### `pdaLinkNode(name, importFrom?)`

Helper function that creates a `PdaLinkNode` object from the name of the `PdaNode` we are referring to.

```ts
const node = pdaLinkNode('myPda');
```

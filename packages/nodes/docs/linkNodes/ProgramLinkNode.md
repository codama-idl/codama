# `ProgramLinkNode`

This node represents a reference to an existing [`ProgramNode`](../ProgramNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute    | Type                | Description                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `"programLinkNode"` | The node discriminator.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `name`       | `CamelCaseString`   | The name of the [`ProgramNode`](../ProgramNode.md) we are referring to.                                                                                                                                                                                                                                                                                                                                                           |
| `importFrom` | `CamelCaseString`   | (Optional) The reference of the module we are importing from or `"hooked"` if the program is defined in the same module but manually written when rendering clients. Default to referrencing directly from the Kinobi IDL instead of using an external referrence. Note that this information is only used for rendering clients. This, it will likely be removed from the Kinobi IDL and pushed to the renderer options instead. |

### Children

_This node has no children._

## Functions

### `programLinkNode(name, importFrom?)`

Helper function that creates a `ProgramLinkNode` object from the name of the `ProgramNode` we are referring to.

```ts
const node = programLinkNode('myProgram');
```

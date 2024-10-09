# `ProgramLinkNode`

This node represents a reference to an existing [`ProgramNode`](../ProgramNode.md) in the Codama IDL.

## Attributes

### Data

| Attribute | Type                | Description                                                             |
| --------- | ------------------- | ----------------------------------------------------------------------- |
| `kind`    | `"programLinkNode"` | The node discriminator.                                                 |
| `name`    | `CamelCaseString`   | The name of the [`ProgramNode`](../ProgramNode.md) we are referring to. |

### Children

_This node has no children._

## Functions

### `programLinkNode(name)`

Helper function that creates a `ProgramLinkNode` object from the name of the `ProgramNode` we are referring to.

```ts
const node = programLinkNode('myProgram');
```

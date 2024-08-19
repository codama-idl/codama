# `DefinedTypeLinkNode`

This node represents a reference to an existing [`DefinedTypeNode`](../DefinedTypeNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                    | Description                                                                     |
| --------- | ----------------------- | ------------------------------------------------------------------------------- |
| `kind`    | `"definedTypeLinkNode"` | The node discriminator.                                                         |
| `name`    | `CamelCaseString`       | The name of the [`DefinedTypeNode`](../DefinedTypeNode.md) we are referring to. |

### Children

| Attribute | Type                                      | Description                                                                                                  |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `program` | [`ProgramLinkNode`](./ProgramLinkNode.md) | (Optional) The program associated with the linked type. Default to using the program we are currently under. |

## Functions

### `definedTypeLinkNode(name, program?)`

Helper function that creates a `DefinedTypeLinkNode` object from the name of the `DefinedTypeNode` we are referring to. If the defined type is from another program, the `program` parameter must be provided as either a `string` or a `ProgramLinkNode`.

```ts
const node = definedTypeLinkNode('myDefinedType');
const nodeFromAnotherProgram = definedTypeLinkNode('myDefinedType', 'myOtherProgram');
```

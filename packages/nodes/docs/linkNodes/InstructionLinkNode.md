# `InstructionLinkNode`

This node represents a reference to an existing [`InstructionNode`](../InstructionNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                    | Description                                                                     |
| --------- | ----------------------- | ------------------------------------------------------------------------------- |
| `kind`    | `"instructionLinkNode"` | The node discriminator.                                                         |
| `name`    | `CamelCaseString`       | The name of the [`InstructionNode`](../InstructionNode.md) we are referring to. |

### Children

| Attribute | Type                                      | Description                                                                                                         |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `program` | [`ProgramLinkNode`](./ProgramLinkNode.md) | (Optional) The program associated with the linked instruction. Default to using the program we are currently under. |

## Functions

### `instructionLinkNode(name, program?)`

Helper function that creates an `InstructionLinkNode` object from the name of the `InstructionNode` we are referring to. If the instruction is from another program, the `program` parameter must be provided as either a `string` or a `ProgramLinkNode`.

```ts
const node = instructionLinkNode('myInstruction');
const nodeFromAnotherProgram = instructionLinkNode('myInstruction', 'myOtherProgram');
```

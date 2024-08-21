# `InstructionArgumentLinkNode`

This node represents a reference to an existing [`InstructionArgumentNode`](../InstructionArgumentNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                            | Description                                                                                     |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `kind`    | `"instructionArgumentLinkNode"` | The node discriminator.                                                                         |
| `name`    | `CamelCaseString`               | The name of the [`InstructionArgumentNode`](../InstructionArgumentNode.md) we are referring to. |

### Children

| Attribute     | Type                                              | Description                                                                                                                                                                                           |
| ------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instruction` | [`InstructionLinkNode`](./InstructionLinkNode.md) | (Optional) The instruction associated with the linked argument. Default to using the instruction we are currently under. Note that the instruction itself can point to a different program is needed. |

## Functions

### `instructionArgumentLinkNode(name, instruction?)`

Helper function that creates an `InstructionArgumentLinkNode` object from the name of the `InstructionArgumentNode` we are referring to. If the argument is from another instruction, the `instruction` parameter must be provided as either a `string` or a `InstructionLinkNode`. When providing an `InstructionLinkNode`, we can also provide a `ProgramLinkNode` to point to a different program.

```ts
// Links to an argument in the current instruction.
const node = instructionArgumentLinkNode('myArgument');

// Links to an argument in another instruction but within the same program.
const nodeFromAnotherInstruction = instructionArgumentLinkNode('myArgument', 'myOtherInstruction');

// Links to an argument in another instruction from another program.
const nodeFromAnotherProgram = instructionArgumentLinkNode(
    'myArgument',
    instructionLinkNode('myOtherInstruction', 'myOtherProgram'),
);
```

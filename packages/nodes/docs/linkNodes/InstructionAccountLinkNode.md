# `InstructionAccountLinkNode`

This node represents a reference to an existing [`InstructionAccountNode`](../InstructionAccountNode.md) in the Kinobi IDL.

## Attributes

### Data

| Attribute | Type                           | Description                                                                                   |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| `kind`    | `"instructionAccountLinkNode"` | The node discriminator.                                                                       |
| `name`    | `CamelCaseString`              | The name of the [`InstructionAccountNode`](../InstructionAccountNode.md) we are referring to. |

### Children

| Attribute     | Type                                              | Description                                                                                                                                                                                          |
| ------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instruction` | [`InstructionLinkNode`](./InstructionLinkNode.md) | (Optional) The instruction associated with the linked account. Default to using the instruction we are currently under. Note that the instruction itself can point to a different program is needed. |

## Functions

### `instructionAccountLinkNode(name, instruction?)`

Helper function that creates an `InstructionAccountLinkNode` object from the name of the `InstructionAccountNode` we are referring to. If the account is from another instruction, the `instruction` parameter must be provided as either a `string` or a `InstructionLinkNode`. When providing an `InstructionLinkNode`, we can also provide a `ProgramLinkNode` to point to a different program.

```ts
// Links to an account in the current instruction.
const node = instructionAccountLinkNode('myAccount');

// Links to an account in another instruction but within the same program.
const nodeFromAnotherInstruction = instructionAccountLinkNode('myAccount', 'myOtherInstruction');

// Links to an account in another instruction from another program.
const nodeFromAnotherProgram = instructionAccountLinkNode(
    'myAccount',
    instructionLinkNode('myOtherInstruction', 'myOtherProgram'),
);
```

# `InstructionNode`

This node represents an instruction in a program.

![Diagram](https://github.com/codama-idl/codama/assets/3642397/0d8edced-cfa4-4500-b80c-ebc56181a338)

## Attributes

### Data

| Attribute                 | Type                         | Description                                                                                                                                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`                    | `"instructionNode"`                                       | The node discriminator.                                                                                                                                                                                                                                                                                                 |
| `name`                    | `CamelCaseString`                                         | The name of the instruction.                                                                                                                                                                                                                                                                                            |
| `docs`                    | `string[]`                                                | Markdown documentation for the instruction.                                                                                                                                                                                                                                                                             |
| `optionalAccountStrategy` | `"omitted"` \| `"programId"`                              | (Optional) Determines how to handle optional accounts. `"omitted"` means optional accounts that are not provided will be omitted from the list of accounts, `"programId"` means they will be replaced by the address of the program to ensure account ordering with only 1 byte of overhead. Defaults to `"programId"`. |

### Children

| Attribute           | Type                                                                          | Description                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`          | [`InstructionAccountNode`](./InstructionAccountNode.md)[]                     | The list of accounts that the instruction uses and their requirements.                                                                                                                  |
| `arguments`         | [`InstructionArgumentNode`](./InstructionArgumentNode.md)[]                   | The arguments the constitute the instruction's data.                                                                                                                                    |
| `extraArguments`    | [`InstructionArgumentNode`](./InstructionArgumentNode.md)[]                   | (Optional) Additional arguments that do not contribute to the instruction's data but may help when defining default values.                                                             |
| `remainingAccounts` | [`InstructionRemainingAccountsNode`](./InstructionRemainingAccountsNode.md)[] | (Optional) The list of dynamic remaining accounts requirements for the instruction. For instance, an instruction may have a variable number of signers at the end of the accounts list. |
| `byteDeltas`        | [`InstructionByteDeltaNode`](./InstructionByteDeltaNode.md)[]                 | (Optional) The list of byte variations that the instruction causes. They should all be added together unless the `subtract` attribute is used.                                          |
| `discriminators`    | [`DiscriminatorNode`](./DiscriminatorNode.md)[]                               | (Optional) The nodes that distinguish this instruction from others in the program. If multiple discriminators are provided, they are combined using a logical AND operation.            |
| `status`            | [`InstructionStatusNode`](./InstructionStatusNode.md)                 | (Optional) The status of the instruction and an optional message about that status.                                                                                                   |
| `subInstructions`   | [`InstructionNode`](./InstructionNode.md)[]                                   | (Optional) A list of nested instructions should this instruction be split into multiple sub-instructions to define distinct scenarios.                                                  |

## Functions

### `instructionNode(input)`

Helper function that creates a `InstructionNode` object from an input object.

```ts
const node = instructionNode({
    name: 'increment',
    accounts: [
        instructionAccountNode({ name: 'counter', isWritable: true, isSigner: false }),
        instructionAccountNode({ name: 'authority', isWritable: false, isSigner: true }),
    ],
    arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') })],
});
```

### `getAllInstructionArguments(instruction)`

Helper function that returns all arguments — including extra arguments — of an instruction as a `InstructionArgumentNode[]`.

```ts
const allArguments = getAllInstructionArguments(instruction);
```

### `getAllInstructionsWithSubs()`

Helper function that returns all instructions with their nested sub-instructions, if any. It can be called on a `RootNode`, `ProgramNode`, or `InstructionNode`.

```ts
const allInstructionsFromTheRoot = getAllInstructionsWithSubs(rootNode);
const allInstructionsFromThisProgram = getAllInstructionsWithSubs(programNode);
const allInstructionsFromThisInstruction = getAllInstructionsWithSubs(instructionNode);
```

## Examples

### An instruction with a u8 discriminator

```ts
instructionNode({
    name: 'increment',
    accounts: [
        instructionAccountNode({ name: 'counter', isWritable: true, isSigner: true }),
        instructionAccountNode({ name: 'authority', isWritable: false, isSigner: false }),
    ],
    arguments: [
        instructionArgumentNode({
            name: 'discriminator',
            type: numberTypeNode('u8'),
            defaultValue: numberValueNode(42),
            defaultValueStrategy: 'omitted',
        }),
    ],
});
```

### An instruction that creates a new account

```ts
instructionNode({
    name: 'createCounter',
    accounts: [
        instructionAccountNode({ name: 'counter', isWritable: true, isSigner: true }),
        instructionAccountNode({ name: 'authority', isWritable: false, isSigner: false }),
    ],
    byteDeltas: [instructionByteDeltaNode(accountLinkNode('counter'))],
});
```

### An instruction with omitted optional accounts

```ts
instructionNode({
    name: 'initialize',
    accounts: [
        instructionAccountNode({ name: 'counter', isWritable: true, isSigner: true }),
        instructionAccountNode({ name: 'authority', isWritable: false, isSigner: false }),
        instructionAccountNode({ name: 'freezeAuthority', isWritable: false, isSigner: false, isOptional: true }),
    ],
    optionalAccountStrategy: 'omitted',
});
```

### An instruction with remaining signers

```ts
instructionNode({
    name: 'multisigIncrement',
    accounts: [instructionAccountNode({ name: 'counter', isWritable: true, isSigner: false })],
    remainingAccounts: [instructionRemainingAccountsNode(argumentValueNode('authorities'), { isSigner: true })],
});
```

### An instruction with nested versioned instructions

```ts
instructionNode({
    name: 'increment',
    accounts: [
        instructionAccountNode({ name: 'counter', isWritable: true, isSigner: 'either' }),
        instructionAccountNode({ name: 'authority', isWritable: false, isSigner: true }),
    ],
    arguments: [
        instructionArgumentNode({ name: 'version', type: numberTypeNode('u8') }),
        instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') }),
    ],
    subInstructions: [
        instructionNode({
            name: 'incrementV1',
            accounts: [instructionAccountNode({ name: 'counter', isWritable: true, isSigner: true })],
            arguments: [
                instructionArgumentNode({
                    name: 'version',
                    type: numberTypeNode('u8'),
                    defaultValue: numberValueNode(0),
                    defaultValueStrategy: 'omitted',
                }),
                instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') }),
            ],
        }),
        instructionNode({
            name: 'incrementV2',
            accounts: [
                instructionAccountNode({ name: 'counter', isWritable: true, isSigner: false }),
                instructionAccountNode({ name: 'authority', isWritable: false, isSigner: true }),
            ],
            arguments: [
                instructionArgumentNode({
                    name: 'version',
                    type: numberTypeNode('u8'),
                    defaultValue: numberValueNode(1),
                    defaultValueStrategy: 'omitted',
                }),
                instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') }),
            ],
        }),
    ],
});
```

### A deprecated instruction

```ts
instructionNode({
    name: 'oldIncrement',
    status: instructionStatusNode('deprecated', { message: 'Use the `increment` instruction instead. This will be removed in v3.0.0.' }),
    accounts: [instructionAccountNode({ name: 'counter', isWritable: true, isSigner: false })],
    arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') })],
});
```

### An archived instruction

```ts
instructionNode({
    name: 'legacyTransfer',
    status: instructionStatusNode('archived', { message: 'This instruction was removed in v2.0.0. It is kept here for historical parsing.' }),
    accounts: [
        instructionAccountNode({ name: 'source', isWritable: true, isSigner: true }),
        instructionAccountNode({ name: 'destination', isWritable: true, isSigner: false }),
    ],
    arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
});
```

### A draft instruction

```ts
instructionNode({
    name: 'experimentalFeature',
    status: instructionStatusNode('draft', { message: 'This instruction is under development and may change.' }),
    accounts: [instructionAccountNode({ name: 'config', isWritable: true, isSigner: true })],
    arguments: [],
});
```

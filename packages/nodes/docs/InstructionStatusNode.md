# `InstructionStatusNode`

This node represents the status of an instruction along with an optional message.

## Attributes

### Data

| Attribute | Type                                         | Description                                                                                                                           |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`    | `"instructionStatusNode"`                | The node discriminator.                                                                                                               |
| `status`  | `"live"` \| `"deprecated"` \| `"archived"` \| `"draft"` | The status of the instruction. `"live"` means accessible (the default), `"deprecated"` means about to be archived, `"archived"` means no longer accessible but kept for historical parsing, `"draft"` means not fully implemented yet. |
| `message` | `string`                                     | (Optional) Additional information about the current status for program consumers.                                                     |

## Functions

### `instructionStatusNode(status, options)`

Helper function that creates an `InstructionStatusNode` object.

```ts
const statusNode = instructionStatusNode('deprecated', { message: 'Use the newInstruction instead' });
```

## Examples

### A live instruction (no status needed)

For live instructions, you typically don't need to set a status at all:

```ts
instructionNode({
    name: 'transfer',
    accounts: [...],
    arguments: [...],
});
```

### A deprecated instruction

```ts
instructionNode({
    name: 'oldTransfer',
    status: instructionStatusNode('deprecated', { message: 'Use the `transfer` instruction instead. This will be removed in v3.0.0.' }),
    accounts: [...],
    arguments: [...],
});
```

### An archived instruction

```ts
instructionNode({
    name: 'legacyTransfer',
    status: instructionStatusNode('archived', { message: 'This instruction was removed in v2.0.0. It is kept here for historical parsing.' }),
    accounts: [...],
    arguments: [...],
});
```

### A draft instruction

```ts
instructionNode({
    name: 'experimentalFeature',
    status: instructionStatusNode('draft', { message: 'This instruction is under development and may change.' }),
    accounts: [...],
    arguments: [...],
});
```

### Status without a message

```ts
instructionNode({
    name: 'someInstruction',
    status: instructionStatusNode('deprecated'),
    accounts: [...],
    arguments: [...],
});
```
